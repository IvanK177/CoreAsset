"use client";

import { useState } from "react";
import { Monitor, Plus, AlertTriangle, CheckCircle2, Cpu, HardDrive, MemoryStick, Laptop, Wrench, Keyboard, Mouse, Printer, HelpCircle, X, type LucideIcon } from "lucide-react";
import { cn, extractJoinObject, formatDateTimeRu } from "@/lib/utils";
import { ComputerStatusBadge as DeviceStatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { Badge } from "@/components/ui/badge";
import { NewTicketDialog } from "@/components/portal/NewTicketDialog";
import { IncidentDetailsDialog } from "@/components/portal/IncidentDetailsDialog";
import { NewRoomRequestDialog } from "@/components/portal/NewRoomRequestDialog";
import { DecompressedText } from "@/components/shared/DecompressedText";
import { Message } from "@/components/TicketChat";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface DeviceData {
  id: string;
  inventory_number: string;
  computer_type: string | null; // DB column name used as Subtype/Model name
  lifecycle_status: string;
  room: string | null;
  hardware: unknown;
  employee_id: string | null;
  device_type: string;
}

interface IncidentData {
  id: string;
  title: string | null;
  description: string;
  priority: string;
  status: string;
  incident_type: string;
  created_at: string;
  device_id: string | null;
  device?: {
    inventory_number: string | null;
    computer_type: string | null;
    device_type: string | null;
  } | {
    inventory_number: string | null;
    computer_type: string | null;
    device_type: string | null;
  }[] | null;
  assignee?: {
    full_name: string | null;
  } | {
    full_name: string | null;
  }[] | null;
  photo_urls?: string[] | null;
  resolution?: string | null;
}

interface RoomRequestData {
  id: string;
  room: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
  photo_urls?: string[] | null;
  resolution?: string | null;
  resolution_photo_urls?: string[] | null;
  assignee?: {
    full_name: string | null;
  } | {
    full_name: string | null;
  }[] | null;
}

interface PortalClientViewProps {
  employeeId: string;
  employeeName: string;
  employeePosition: string;
  devices: DeviceData[];
  incidents: IncidentData[];
  roomRequests: RoomRequestData[];
  openIncidents: number;
  resolvedIncidents: number;
  initialMessagesMap: Record<string, Message[]>;
}

const deviceIconMap: Record<string, LucideIcon> = {
  pc: Cpu,
  monitor: Monitor,
  keyboard: Keyboard,
  mouse: Mouse,
  printer: Printer,
  other: HelpCircle,
};

const deviceTypeRussianLabels: Record<string, string> = {
  pc: "Компьютер",
  monitor: "Монитор",
  keyboard: "Клавиатура",
  mouse: "Мышь",
  printer: "Принтер",
  other: "Устройство",
};

const statusLabels: Record<string, string> = {
  open: "Открыта",
  in_progress: "В работе",
  resolved: "Решена",
  cancelled: "Отменена",
};

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
};

function formatDate(dateStr: string): string {
  return formatDateTimeRu(dateStr);
}

function getIncidentTitle(incident: IncidentData): string {
  if (incident.title) return incident.title;
  // Fallback: extract first line from description
  const lines = incident.description.split("\n");
  return lines[0]?.substring(0, 80) ?? "Инцидент";
}

function getIncidentNumber(incident: IncidentData): string {
  // Generate a short display number from the UUID
  const shortId = incident.id.substring(0, 8);
  return `#T${shortId}`;
}

export default function PortalClientView({
  employeeId,
  employeeName,
  devices,
  incidents,
  roomRequests,
  openIncidents,
  resolvedIncidents,
  initialMessagesMap,
}: PortalClientViewProps) {
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [roomRequestDialogOpen, setRoomRequestDialogOpen] = useState(false);
  const [typeChoiceOpen, setTypeChoiceOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<IncidentData | null>(null);
  const [selectedRoomRequest, setSelectedRoomRequest] = useState<RoomRequestData | null>(null);
  const [portalTab, setPortalTab] = useState<"active" | "archive">("active");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const firstName = employeeName.split(" ")[0] ?? employeeName;

  const activeItems = [
    ...incidents.filter((i) => i.status === "open" || i.status === "in_progress").map((i) => ({ ...i, itemType: "it" as const })),
    ...roomRequests.filter((r) => r.status === "open" || r.status === "in_progress").map((r) => ({ ...r, itemType: "aho" as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const archivedItems = [
    ...incidents.filter((i) => i.status === "resolved" || i.status === "cancelled").map((i) => ({ ...i, itemType: "it" as const })),
    ...roomRequests.filter((r) => r.status === "resolved").map((r) => ({ ...r, itemType: "aho" as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const currentItems = portalTab === "active" ? activeItems : archivedItems;

  return (
    <div className="space-y-6">
      {/* ===== Block 1: Welcome Banner ===== */}
      <div className="rounded-2xl bg-blue-600 p-6 text-white">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">Привет, {firstName}!</h1>
            <p className="text-blue-100 text-sm mb-4">
              Есть проблема с устройством или кабинетом? Создайте заявку и мы разберёмся.
            </p>
            <button
              onClick={() => setTypeChoiceOpen(true)}
              className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-white text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors cursor-pointer w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Создать заявку
            </button>
          </div>
          <div className="flex flex-row sm:flex-col items-center justify-around sm:justify-center gap-4 sm:gap-1 sm:ml-6 border-t border-blue-500/30 sm:border-t-0 pt-4 sm:pt-0 shrink-0">
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-bold">{openIncidents}</span>
              <span className="text-blue-200 text-xs">Открытых заявок</span>
            </div>
            <div className="flex flex-col items-center sm:mt-1">
              <span className="text-xl sm:text-base font-semibold sm:font-normal">{resolvedIncidents}</span>
              <span className="text-blue-300 text-[10px] sm:text-xs">решено</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Block 2: My Devices ===== */}
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Мои устройства ({devices.length})
        </h2>

        {devices.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Нет привязанных устройств
          </p>
        ) : (
          <div className="max-h-[220px] overflow-y-auto pr-1 custom-scrollbar space-y-3">
            {devices.map((comp) => {
              const hw = (comp.hardware as Record<string, string> | null) ?? null;
              const IconComponent = deviceIconMap[comp.device_type] || Laptop;
              const typeLabel = deviceTypeRussianLabels[comp.device_type] || "Устройство";
              return (
                <div
                  key={comp.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border"
                >
                  {/* Icon */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 shrink-0">
                    <IconComponent className="w-5 h-5 text-blue-500" />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-foreground text-sm">
                        {comp.inventory_number}
                      </span>
                      <DeviceStatusBadge status={comp.lifecycle_status as "active" | "repair" | "decommissioned" | "storage"} />
                      <span className="text-xs text-muted-foreground">
                        [{typeLabel}] {comp.computer_type ?? "—"}
                        {comp.room && ` · каб. ${comp.room}`}
                      </span>
                    </div>

                    {/* Specifications */}
                    {comp.device_type === "pc" && hw && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mt-1">
                        {hw.cpu && (
                          <span className="flex items-center gap-1">
                            <Cpu className="w-3 h-3" />
                            {hw.cpu}
                          </span>
                        )}
                        {hw.ram && (
                          <span className="flex items-center gap-1">
                            <MemoryStick className="w-3 h-3" />
                            {hw.ram}
                          </span>
                        )}
                        {hw.storage && (
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3" />
                            {hw.storage}
                          </span>
                        )}
                      </div>
                    )}

                    {comp.device_type === "monitor" && hw && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mt-1">
                        {hw.diagonal && (
                          <span className="flex items-center gap-1">
                            <Monitor className="w-3 h-3" />
                            {hw.diagonal}
                          </span>
                        )}
                        {hw.resolution && (
                          <span className="flex items-center gap-1 font-mono">
                            {hw.resolution}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== Block 3: My Tickets & AHO Requests ===== */}
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
        {/* Tab switcher header */}
        <div className="flex items-center justify-between mb-4 border-b border-border pb-3 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-foreground">
            Мои заявки ({activeItems.length + archivedItems.length})
          </h2>
          <div className="flex bg-muted p-0.5 rounded-lg">
            <button
              onClick={() => setPortalTab("active")}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                portalTab === "active" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Активные ({activeItems.length})
            </button>
            <button
              onClick={() => setPortalTab("archive")}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                portalTab === "archive" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Архив ({archivedItems.length})
            </button>
          </div>
        </div>

        {currentItems.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center bg-muted/20 rounded-xl border border-border border-dashed">
            {portalTab === "active" ? "Нет активных заявок" : "Архив пуст"}
          </p>
        ) : (
          <div className="max-h-[380px] overflow-y-auto pr-1 custom-scrollbar space-y-3">
            {currentItems.map((item) => {
              const isOpen = item.status === "open" || item.status === "in_progress";
              const isIT = item.itemType === "it";

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isIT) {
                      setSelectedIncident(item as IncidentData);
                    } else {
                      setSelectedRoomRequest(item as RoomRequestData);
                    }
                  }}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-muted/20 border border-border hover:border-blue-500/30 hover:bg-blue-500/5 cursor-pointer transition-all duration-150",
                    portalTab === "archive" && "p-3 bg-muted/10"
                  )}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Status/Type icon */}
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                      isOpen 
                        ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" 
                        : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                    )}>
                      {isIT ? (
                        isOpen ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Wrench className="w-4 h-4" />
                      )}
                    </div>

                    {/* Request info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">
                          {isIT ? getIncidentNumber(item as IncidentData) : `#R${item.id.substring(0, 4).toUpperCase()}`}
                        </span>
                        <span className="font-semibold text-sm text-foreground truncate">
                          {isIT ? getIncidentTitle(item as IncidentData) : `Заявка АХЧ: каб. ${item.room}`}
                        </span>
                        {isIT && (() => {
                          const deviceObj = extractJoinObject((item as IncidentData).device) as { device_type: string | null } | null;
                          const deviceType = deviceObj?.device_type;
                          if (!deviceType) return null;
                          const emojiMap: Record<string, string> = {
                            pc: "💻",
                            monitor: "🖥️",
                            keyboard: "⌨️",
                            mouse: "🖱️",
                            printer: "🖨️",
                            other: "🔌",
                          };
                          const typeLabel = deviceTypeRussianLabels[deviceType] || "Устройство";
                          return (
                            <span className="text-[11px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium select-none border border-blue-500/20 shrink-0">
                              <span>{emojiMap[deviceType] || "🔌"}</span>
                              <span>{typeLabel}</span>
                            </span>
                          );
                        })()}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                          {isIT ? "IT инцидент" : "АХЧ"}
                        </span>
                        <span>·</span>
                        <span>{formatDate(item.created_at)}</span>
                        {isIT && item.status === "resolved" && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-600 font-medium">Решено кем: {(() => {
                              const assignee = extractJoinObject((item as IncidentData).assignee) as { full_name: string | null } | null;
                              return assignee?.full_name ?? "IT-специалист";
                            })()}</span>
                          </>
                        )}
                        {!isIT && item.status === "resolved" && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-600 font-medium">Решено кем: {(() => {
                              const assignee = extractJoinObject((item as RoomRequestData).assignee) as { full_name: string | null } | null;
                              return assignee?.full_name ?? "Сотрудник АХЧ";
                            })()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap pl-11 sm:pl-0">
                    {isIT && (
                      <PriorityBadge priority={(item as IncidentData).priority as "low" | "medium" | "high" | "critical"} />
                    )}
                    {!isIT && (
                      <Badge variant="outline" className={cn("text-xs font-semibold px-2 py-0.5", item.type?.toLowerCase() === "ремонт" ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20" : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20")}>
                        {item.type?.toLowerCase() === "ремонт" ? "Ремонт" : "Оснащение"}
                      </Badge>
                    )}
                    <Badge variant="outline" className={cn("text-xs font-medium px-2 py-0.5", statusColors[item.status] || "bg-gray-100")}>
                      {statusLabels[item.status] || item.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== New Ticket Dialog ===== */}
      <NewTicketDialog
        open={ticketDialogOpen}
        onOpenChange={setTicketDialogOpen}
        employeeId={employeeId}
        devices={devices}
      />

      {/* ===== New Room Request Dialog ===== */}
      <NewRoomRequestDialog
        open={roomRequestDialogOpen}
        onOpenChange={setRoomRequestDialogOpen}
        employeeId={employeeId}
        defaultRoom={devices[0]?.room ?? ""}
      />

      {/* ===== Request Type Choice Dialog ===== */}
      <Dialog open={typeChoiceOpen} onOpenChange={setTypeChoiceOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-center">Создать заявку</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground text-center">
              Выберите тип проблемы для обращения в соответствующую службу
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-4">
            {/* IT Incident Card */}
            <button
              onClick={() => {
                setTypeChoiceOpen(false);
                setTicketDialogOpen(true);
              }}
              className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-blue-500/30 hover:bg-blue-500/5 text-left transition-all duration-150 group cursor-pointer"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                <Laptop className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm mb-1">Проблемы с IT-оборудованием</h4>
                <p className="text-xs text-muted-foreground leading-normal">
                  Не работает ПК, монитор, клавиатура, ПО, интернет, принтер или телефония.
                </p>
              </div>
            </button>

            {/* Room Request Card */}
            <button
              onClick={() => {
                setTypeChoiceOpen(false);
                setRoomRequestDialogOpen(true);
              }}
              className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 text-left transition-all duration-150 group cursor-pointer"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm mb-1">Ремонт или оснащение кабинета</h4>
                <p className="text-xs text-muted-foreground leading-normal">
                  Сломалась мебель, перегорела лампа, розетка, нужен ремонт или доп. оснащение.
                </p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Incident Details Dialog ===== */}
      <IncidentDetailsDialog
        open={!!selectedIncident}
        onOpenChange={(open) => !open && setSelectedIncident(null)}
        incident={selectedIncident}
        employeeId={employeeId}
        initialMessages={selectedIncident ? (initialMessagesMap[selectedIncident.id] ?? []) : []}
      />

      {/* ===== Room Request Details Dialog ===== */}
      <Dialog open={!!selectedRoomRequest} onOpenChange={(open) => !open && setSelectedRoomRequest(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto rounded-2xl p-5 sm:p-6">
          {selectedRoomRequest && (
            <>
              <DialogHeader className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                    #R{selectedRoomRequest.id.substring(0, 4).toUpperCase()}
                  </span>
                  <Badge variant="outline" className={cn("text-xs font-semibold px-2 py-0.5", selectedRoomRequest.type?.toLowerCase() === "ремонт" ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20" : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20")}>
                    {selectedRoomRequest.type?.toLowerCase() === "ремонт" ? "Ремонт" : "Оснащение"}
                  </Badge>
                  <Badge variant="outline" className={cn("text-xs font-medium px-2 py-0.5", selectedRoomRequest.status === "open" ? "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20" : selectedRoomRequest.status === "in_progress" ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20")}>
                    {selectedRoomRequest.status === "open" ? "Открыта" : selectedRoomRequest.status === "in_progress" ? "В работе" : "Решена"}
                  </Badge>
                </div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Заявка АХЧ: Кабинет {selectedRoomRequest.room}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Создана: {formatDate(selectedRoomRequest.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4">
                <div className="space-y-1 bg-muted/40 p-4 rounded-xl border border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Описание проблемы</h4>
                  <DecompressedText text={selectedRoomRequest.description} className="text-sm text-foreground whitespace-pre-wrap leading-relaxed" />
                </div>

                {selectedRoomRequest.photo_urls && selectedRoomRequest.photo_urls.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Прикрепленные фото ({selectedRoomRequest.photo_urls.length})
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedRoomRequest.photo_urls.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPreviewImageUrl(url)}
                          className="relative aspect-video rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity cursor-pointer focus:outline-none"
                        >
                          <img
                            src={url}
                            alt={`Вложение ${idx + 1}`}
                            className="object-cover w-full h-full"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRoomRequest.status === "resolved" && (
                  <div className="space-y-1 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                    <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Выполненная работа</h4>
                    {selectedRoomRequest.resolution && (
                      <p className="text-sm text-emerald-900 dark:text-emerald-100 whitespace-pre-wrap mb-2">{selectedRoomRequest.resolution}</p>
                    )}
                    {(() => {
                      const assignee = extractJoinObject(selectedRoomRequest.assignee) as { full_name: string | null } | null;
                      if (assignee?.full_name) {
                        return (
                          <p className="text-xs text-muted-foreground">
                            Исполнитель: <span className="font-semibold text-foreground">{assignee.full_name}</span>
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}

                {selectedRoomRequest.status === "resolved" && selectedRoomRequest.resolution_photo_urls && selectedRoomRequest.resolution_photo_urls.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      Фотоотчет выполненной работы ({selectedRoomRequest.resolution_photo_urls.length})
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedRoomRequest.resolution_photo_urls.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPreviewImageUrl(url)}
                          className="relative aspect-video rounded-lg overflow-hidden border border-emerald-100 hover:opacity-90 transition-opacity cursor-pointer focus:outline-none"
                        >
                          <img
                            src={url}
                            alt={`Решение ${idx + 1}`}
                            className="object-cover w-full h-full"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedRoomRequest(null)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors cursor-pointer"
                >
                  Закрыть
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Photo Preview Dialog */}
      <Dialog open={!!previewImageUrl} onOpenChange={(open) => !open && setPreviewImageUrl(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-3xl mx-auto bg-transparent border-none shadow-none p-0 flex items-center justify-center">
          {previewImageUrl && (
            <div className="relative max-w-full max-h-[85vh] rounded-xl overflow-hidden bg-black/50 p-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/85 text-white rounded-full p-2 cursor-pointer transition-colors z-[100] focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={previewImageUrl}
                alt="Просмотр изображения"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}