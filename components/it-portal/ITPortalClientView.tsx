"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Clock, Loader2, Monitor, User, Wrench, Building, X, Cpu, Keyboard, Mouse, Printer, HelpCircle, Camera, Image as ImageIcon } from "lucide-react";
import { cn, extractJoinObject, BUILDING_ADDRESSES, formatDateTimeRu } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { DecompressedText } from "@/components/shared/DecompressedText";
import { takeIncidentToWork, resolveIncident } from "@/lib/actions/it-portal";
import { ITPortalIncidentDetailsDialog } from "./ITPortalIncidentDetailsDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/* ── Types ── */

interface RelatedEmployee {
  full_name: string | null;
  room: string | null;
  building: string | null;
}

interface RelatedDevice {
  inventory_number: string | null;
  computer_type: string | null; // DB column name used as Subtype/Model name
  device_type: string | null;
}

interface IncidentRow {
  id: string;
  title: string | null;
  description: string;
  priority: string;
  status: string;
  incident_type: string;
  created_at: string;
  resolved_at: string | null;
  assigned_to: string | null;
  employee: RelatedEmployee | RelatedEmployee[] | null;
  device: RelatedDevice | RelatedDevice[] | null;
  assignee?: { full_name: string | null } | { full_name: string | null }[] | null;
  photo_urls?: string[] | null;
  resolution?: string | null;
}

interface ITPortalClientViewProps {
  specialistId: string;
  incidents: IncidentRow[];
  currentPath: string;
}

/* ── Helpers ── */

const incidentTypeLabels: Record<string, string> = {
  hardware: "Оборудование",
  software: "Программы",
  network: "Сеть",
  other: "Другое",
};

const deviceTypeRussianLabels: Record<string, string> = {
  pc: "Компьютер",
  monitor: "Монитор",
  keyboard: "Клавиатура",
  mouse: "Мышь",
  printer: "Принтер",
  other: "Устройство",
};

const deviceTypeEmojis: Record<string, string> = {
  pc: "💻",
  monitor: "🖥️",
  keyboard: "⌨️",
  mouse: "🖱️",
  printer: "🖨️",
  other: "🔌",
};

const deviceIconMap: Record<string, any> = {
  pc: Cpu,
  monitor: Monitor,
  keyboard: Keyboard,
  mouse: Mouse,
  printer: Printer,
  other: HelpCircle,
};

function formatDate(dateStr: string): string {
  return formatDateTimeRu(dateStr);
}

function getIncidentTitle(incident: IncidentRow): string {
  if (incident.title) return incident.title;
  const lines = incident.description.split("\n");
  return lines[0]?.substring(0, 80) ?? "Инцидент";
}

function getIncidentNumber(incident: IncidentRow): string {
  const shortId = incident.id.substring(0, 8);
  return `#T${shortId}`;
}

function getEmployeeName(incident: IncidentRow): string {
  if (!incident.employee) return "—";
  const emp = Array.isArray(incident.employee) ? incident.employee[0] : incident.employee;
  if (!emp?.full_name) return "—";
  return `${emp.full_name}${emp.room ? ` (Каб. ${emp.room})` : ""}`;
}

function getDeviceInfo(incident: IncidentRow): string {
  if (!incident.device) return "";
  const dev = Array.isArray(incident.device) ? incident.device[0] : incident.device;
  if (!dev?.inventory_number) return "";
  const typeLabel = deviceTypeRussianLabels[dev.device_type ?? ""] || "Устройство";
  return `${dev.inventory_number} [${typeLabel}] (${dev.computer_type ?? "—"})`;
}

/* ── Component ── */

export default function ITPortalClientView({
  specialistId,
  incidents,
  currentPath,
}: ITPortalClientViewProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [selectedIncident, setSelectedIncident] = useState<IncidentRow | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolvingIncidentId, setResolvingIncidentId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const [resolutionPhotos, setResolutionPhotos] = useState<File[]>([]);
  const [resolutionPhotoPreviews, setResolutionPhotoPreviews] = useState<string[]>([]);

  const handleResolutionPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setResolutionPhotos((prev) => [...prev, ...filesArray]);

      const previewsArray = filesArray.map((file) => URL.createObjectURL(file));
      setPhotoPreviewsArray(previewsArray);
    }
  };

  const setPhotoPreviewsArray = (previewsArray: string[]) => {
    setResolutionPhotoPreviews((prev) => [...prev, ...previewsArray]);
  };

  const removeResolutionPhoto = (index: number) => {
    setResolutionPhotos((prev) => prev.filter((_, i) => i !== index));
    setResolutionPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const [buildingFilter, setBuildingFilter] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("it_building_filter") || "all";
    }
    return "all";
  });

  const handleBuildingChange = (val: string) => {
    setBuildingFilter(val);
    localStorage.setItem("it_building_filter", val);
  };

  const isMyTasks = currentPath === "/it-portal/my-tasks";
  const isArchive = currentPath === "/it-portal/archive";

  const handleTakeToWork = (incidentId: string) => {
    setPendingId(incidentId);
    startTransition(async () => {
      await takeIncidentToWork(incidentId, specialistId);
      setPendingId(null);
    });
  };

  const handleResolveClick = (incidentId: string) => {
    setResolvingIncidentId(incidentId);
    setResolutionText("");
    setResolveDialogOpen(true);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingIncidentId) return;

    setResolveDialogOpen(false);
    setPendingId(resolvingIncidentId);

    // Upload resolution photos if any
    const uploadedUrls: string[] = [];
    try {
      if (resolutionPhotos.length > 0) {
        const { compressImageToTarget } = await import("@/lib/image/compressImage");
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        for (const file of resolutionPhotos) {
          let fileToUpload = file;
          try {
            const compressionResult = await compressImageToTarget(file);
            fileToUpload = compressionResult.file;
            console.log(`Original: ${Math.round(file.size / 1024)}KB, Compressed: ${compressionResult.finalSizeKB}KB`);
          } catch (compressErr) {
            console.warn("Compression failed, using original:", compressErr);
          }

          const fileExt = fileToUpload.name.split(".").pop();
          const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto 
            ? crypto.randomUUID() 
            : `${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
          const fileName = `${uuid}.${fileExt}`;
          const filePath = `resolutions/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from("ticket-attachments")
            .upload(filePath, fileToUpload, {
              contentType: fileToUpload.type,
              upsert: false,
            });

          if (uploadError) {
            toast.error(`Ошибка при загрузке фото ${file.name}`);
            setPendingId(null);
            return;
          }

          const { data: { publicUrl } } = supabase.storage
            .from("ticket-attachments")
            .getPublicUrl(filePath);

          uploadedUrls.push(publicUrl);
        }
      }
    } catch (err) {
      console.error("Resolution photo upload exception:", err);
      toast.error("Не удалось загрузить фотографии выполненной работы");
      setPendingId(null);
      return;
    }

    startTransition(async () => {
      await resolveIncident(resolvingIncidentId, resolutionText, uploadedUrls);
      setPendingId(null);
      setResolvingIncidentId(null);
      setResolutionText("");
      setResolutionPhotos([]);
      setResolutionPhotoPreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });
    });
  };

  // Filter display list
  const displayIncidents = incidents.filter((inc) => {
    // 1. Path filters
    if (isMyTasks) {
      if (inc.status !== "in_progress" || inc.assigned_to !== specialistId) return false;
    } else if (isArchive) {
      if (inc.status !== "resolved" && inc.status !== "cancelled") return false;
    } else {
      // Default (All open/in_progress)
      if (inc.status !== "open" && inc.status !== "in_progress") return false;
    }

    // 2. Building filter
    if (buildingFilter !== "all") {
      const emp = Array.isArray(inc.employee) ? inc.employee[0] : inc.employee;
      if (emp?.building !== buildingFilter) return false;
    }

    return true;
  });

  // Calculate stats values
  const openCountVal = incidents.filter((i) => i.status === "open").length;
  const inProgressCountVal = incidents.filter((i) => i.status === "in_progress").length;
  const resolvedCountVal = incidents.filter((i) => i.status === "resolved").length;

  if (selectedIncident) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Quick navigation list */}
          <div className="w-full lg:w-1/3 space-y-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50 max-h-[600px] overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Заявки в списке</h3>
            {displayIncidents.map((inc) => (
              <button
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all duration-150 flex flex-col gap-1 cursor-pointer bg-white",
                  selectedIncident.id === inc.id
                    ? "border-blue-400 bg-blue-50/10 shadow-sm"
                    : "border-gray-100 hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400 font-mono">{getIncidentNumber(inc)}</span>
                  <PriorityBadge priority={inc.priority as "low" | "medium" | "high" | "critical"} />
                  <IncidentStatusBadge status={inc.status as "open" | "in_progress" | "resolved" | "cancelled"} />
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{getIncidentTitle(inc)}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span>{getDeviceInfo(inc) || "—"}</span>
                </p>
              </button>
            ))}
          </div>

          {/* Right: Detail panel */}
          <div className="w-full lg:w-2/3 rounded-xl bg-white shadow-sm p-4 md:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">{getIncidentNumber(selectedIncident)}</span>
                {(() => {
                  const dev = Array.isArray(selectedIncident.device) ? selectedIncident.device[0] : selectedIncident.device;
                  if (!dev?.device_type) return null;
                  const typeLabel = deviceTypeRussianLabels[dev.device_type] || "Устройство";
                  const emoji = deviceTypeEmojis[dev.device_type] || "🔌";
                  return (
                    <Badge variant="outline" className="text-xs font-semibold bg-slate-50 text-slate-700 border-slate-200">
                      {emoji} {typeLabel}
                    </Badge>
                  );
                })()}
                <PriorityBadge priority={selectedIncident.priority as "low" | "medium" | "high" | "critical"} />
                <IncidentStatusBadge status={selectedIncident.status as "open" | "in_progress" | "resolved" | "cancelled"} />
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">{getIncidentTitle(selectedIncident)}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Создано: {formatDate(selectedIncident.created_at)}
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Описание</h4>
                <DecompressedText text={selectedIncident.description} className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Заявитель</h4>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-800">{getEmployeeName(selectedIncident)}</p>
                    <p className="text-xs text-gray-500">Корпус: {(() => {
                      const emp = Array.isArray(selectedIncident.employee) ? selectedIncident.employee[0] : selectedIncident.employee;
                      return emp?.building ?? "—";
                    })()}</p>
                  </div>
                </div>

                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Устройство</h4>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-800">{getDeviceInfo(selectedIncident) || "Нет привязанного устройства"}</p>
                  </div>
                </div>
              </div>

              {/* Attached Photos */}
              {selectedIncident.photo_urls && selectedIncident.photo_urls.length > 0 && (
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100/50 space-y-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Фотографии ({selectedIncident.photo_urls.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedIncident.photo_urls.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewImageUrl(url)}
                        className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 block hover:opacity-85 transition-opacity cursor-pointer focus:outline-none"
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
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedIncident(null)}
                className="rounded-lg h-9 text-sm"
              >
                Закрыть
              </Button>
              {selectedIncident.status === "open" && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-9 text-sm cursor-pointer"
                  onClick={() => {
                    handleTakeToWork(selectedIncident.id);
                    setSelectedIncident(null);
                  }}
                >
                  Взять в работу
                </Button>
              )}
              {selectedIncident.status === "in_progress" && selectedIncident.assigned_to === specialistId && (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-9 text-sm cursor-pointer"
                  onClick={() => {
                    handleResolveClick(selectedIncident.id);
                    setSelectedIncident(null);
                  }}
                >
                  Решено
                </Button>
              )}
            </div>
          </div>
        </div>
      {/* Photo Preview Dialog */}
      <Dialog open={!!previewImageUrl} onOpenChange={(open) => !open && setPreviewImageUrl(null)}>
        <DialogContent className="sm:max-w-3xl bg-transparent border-none shadow-none p-0 flex items-center justify-center">
          {previewImageUrl && (
            <div className="relative max-w-full max-h-[85vh] rounded-xl overflow-hidden bg-black/50 p-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/85 text-white rounded-full p-2 cursor-pointer transition-colors z-50 focus:outline-none"
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

  return (
    <div className="space-y-6">
      {/* ===== Header Banner ===== */}
      <div className="rounded-2xl bg-blue-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">
              {isMyTasks ? "Мои задачи" : isArchive ? "Архив заявок" : "Заявки"}
            </h1>
            <p className="text-blue-100 text-sm">
              {isMyTasks
                ? "Заявки, которые вы взяли в работу."
                : isArchive
                ? "Все решённые и закрытые заявки."
                : "Все входящие заявки от сотрудников. Берите в работу и решайте."}
            </p>
          </div>
          <div className="flex items-center gap-6 ml-6">
            {!isMyTasks && !isArchive && (
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold">{openCountVal}</span>
                <span className="text-blue-200 text-xs">Открытых</span>
              </div>
            )}
            {!isArchive && (
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold">{inProgressCountVal}</span>
                <span className="text-blue-200 text-xs">В работе</span>
              </div>
            )}
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">{resolvedCountVal}</span>
              <span className="text-blue-200 text-xs">Решено</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Ticket List & SLA Side-by-Side ===== */}
      <div className="space-y-4">
        {/* Building Filter Bar */}
        <div className="flex items-center gap-2 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <Building className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Корпус:</span>
          <select
            value={buildingFilter}
            onChange={(e) => handleBuildingChange(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none max-w-[240px] truncate cursor-pointer"
          >
            <option value="all">Все корпуса</option>
            {Object.keys(BUILDING_ADDRESSES).map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left: ticket listing or empty state */}
          <div className="lg:col-span-3">
            {displayIncidents.length === 0 ? (
              <div className="rounded-2xl bg-white p-12 shadow-sm border border-gray-100 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {isMyTasks ? "Нет задач в работе" : isArchive ? "Архив пуст" : "Нет заявок"}
                </h3>
                <p className="text-sm text-gray-500">
                  {isMyTasks
                    ? "В работе нет заявок. Перейдите в \"Заявки\", чтобы начать."
                    : isArchive
                    ? "Здесь будут отображаться решённые заявки."
                    : "Все заявки обработаны. Отличная работа!"}
                </p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto pr-1 custom-scrollbar space-y-3">
                {displayIncidents.map((incident) => {
                  const isOpen = incident.status === "open";
                  const isInProgress = incident.status === "in_progress";
                  const isResolved = incident.status === "resolved";
                  const isAssignedToMe = incident.assigned_to === specialistId;
                  const isActionPending = pendingId === incident.id;

                  return (
                    <div
                      key={incident.id}
                      onClick={() => setSelectedIncident(incident)}
                      className={cn(
                        "rounded-2xl bg-white p-5 shadow-sm border transition-all duration-150 cursor-pointer hover:shadow-md hover:border-slate-300",
                        isOpen ? "border-yellow-200" : isInProgress ? "border-blue-200" : "border-emerald-200"
                      )}
                    >
                      {/* Top row: number + title + badges */}
                      <div className="flex items-start gap-3 mb-3">
                        {/* Status icon */}
                        <div className={cn(
                          "flex items-center justify-center w-9 h-9 rounded-full shrink-0",
                          isOpen ? "bg-yellow-100" : isInProgress ? "bg-blue-100" : "bg-emerald-100"
                        )}>
                          {isOpen
                            ? <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            : isInProgress
                              ? <Clock className="w-4 h-4 text-blue-600" />
                              : <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          }
                        </div>

                        {/* Title + meta */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-medium text-gray-400">
                              {getIncidentNumber(incident)}
                            </span>
                            <span className="font-semibold text-sm text-gray-900 truncate">
                              {getIncidentTitle(incident)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-550 flex-wrap">
                            {/* Author */}
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-gray-400" />
                              {getEmployeeName(incident)}
                            </span>
                            {/* Device */}
                            {getDeviceInfo(incident) && (
                              <span className="flex items-center gap-1 font-mono">
                                <Monitor className="w-3 h-3 text-gray-400" />
                                {getDeviceInfo(incident)}
                              </span>
                            )}
                            {/* Type */}
                            <span className="flex items-center gap-1">
                              <Wrench className="w-3 h-3 text-gray-400" />
                              {incidentTypeLabels[incident.incident_type] ?? incident.incident_type}
                            </span>
                            {/* Date */}
                            <span>{formatDate(incident.created_at)}</span>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 shrink-0">
                          {(() => {
                            const dev = Array.isArray(incident.device) ? incident.device[0] : incident.device;
                            if (!dev?.device_type) return null;
                            const typeLabel = deviceTypeRussianLabels[dev.device_type] || "Устройство";
                            const emoji = deviceTypeEmojis[dev.device_type] || "🔌";
                            return (
                              <Badge variant="outline" className="text-xs font-semibold bg-slate-50 text-slate-700 border-slate-200">
                                {emoji} {typeLabel}
                              </Badge>
                            );
                          })()}
                          <PriorityBadge priority={incident.priority as "low" | "medium" | "high" | "critical"} />
                          <IncidentStatusBadge status={incident.status as "open" | "in_progress" | "resolved" | "cancelled"} />
                          {isInProgress && incident.assigned_to && (
                            <Badge variant="outline" className="text-xs font-medium bg-blue-50 text-blue-700 border-blue-200">
                              {isAssignedToMe ? "Моя задача" : "В работе у другого"}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Description preview */}
                      {incident.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2 pl-12">
                          <DecompressedText text={incident.description} truncate={150} />
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pl-12">
                        {isOpen && (
                          <Button
                            size="sm"
                            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                            disabled={isActionPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTakeToWork(incident.id);
                            }}
                          >
                            {isActionPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                            Взять в работу
                          </Button>
                        )}
                        {isInProgress && isAssignedToMe && (
                          <Button
                            size="sm"
                            className="gap-2 bg-emerald-600 hover:bg-emerald-750 text-white cursor-pointer"
                            disabled={isActionPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolveClick(incident.id);
                            }}
                          >
                            {isActionPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Решено
                          </Button>
                        )}
                        {isResolved && incident.resolved_at && (
                          <span className="text-xs text-emerald-600 flex items-center gap-1.5 flex-wrap">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Решено {formatDate(incident.resolved_at)}</span>
                            <span>·</span>
                            <span className="font-medium">Решено кем: {(() => {
                              const assignee = extractJoinObject(incident.assignee) as { full_name: string | null } | null;
                              return assignee?.full_name ?? "IT-специалист";
                            })()}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: SLA Deadlines Card */}
          <div className="lg:col-span-1 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4 shrink-0 self-start">
            <div>
              <h3 className="font-bold text-gray-900 text-sm tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Сроки решения
              </h3>
              <p className="text-xs text-gray-550 mt-1 leading-relaxed">Регламент исправления инцидентов по приоритетам</p>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-red-50/70 border border-red-100/50">
                <span className="font-semibold text-red-700">Критический</span>
                <span className="font-bold text-red-800">1 день</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-orange-50/70 border border-orange-100/50">
                <span className="font-semibold text-orange-700">Высокий</span>
                <span className="font-bold text-orange-800">1–2 дня</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-blue-50/70 border border-blue-100/50">
                <span className="font-semibold text-blue-700">Средний</span>
                <span className="font-bold text-blue-800">3–5 дней</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-gray-50/70 border border-gray-100/50">
                <span className="font-semibold text-gray-600">Низкий</span>
                <span className="font-bold text-gray-700">5–7 дней</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ITPortalIncidentDetailsDialog
        open={!!selectedIncident}
        onOpenChange={(open) => !open && setSelectedIncident(null)}
        incident={selectedIncident}
      />

      {/* Resolve Ticket Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Завершение заявки</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Укажите, какие действия были предприняты для решения проблемы
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResolveSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resolution-text">Описание решения *</Label>
              <Textarea
                id="resolution-text"
                placeholder="Например: Заменили кабель питания монитора, проверили работоспособность."
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                required
                rows={4}
              />
            </div>
            {/* Resolution Photos Attach */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5 text-gray-700">
                <Camera className="w-4 h-4 text-gray-500" />
                Прикрепить фото проделанной работы (опционально)
              </Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center justify-center border border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleResolutionPhotoChange}
                    className="hidden"
                  />
                  <div className="text-center space-y-1">
                    <ImageIcon className="w-5 h-5 text-gray-400 mx-auto" />
                    <span className="text-xs text-gray-500 block">Нажмите для выбора фото решения</span>
                  </div>
                </label>

                {resolutionPhotoPreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {resolutionPhotoPreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-lg border overflow-hidden group">
                        <img src={preview} alt="Решение" className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => removeResolutionPhoto(index)}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-black/90 text-white rounded-full p-1 cursor-pointer transition-colors"
                          title="Удалить"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setResolveDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Завершить
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}