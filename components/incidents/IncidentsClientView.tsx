"use client";

import { useState, useTransition } from "react";
import { cn, formatDateTime, BUILDING_ADDRESSES } from "@/lib/utils";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";
import { updateIncidentStatus } from "@/lib/actions/incidents";
import { X, AlertTriangle, Monitor, Users, Calendar, CheckCircle, Loader2 } from "lucide-react";
import { DecompressedText } from "@/components/shared/DecompressedText";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type IncidentStatus = "open" | "in_progress" | "resolved" | "cancelled";
type IncidentPriority = "low" | "medium" | "high" | "critical";

interface IncidentRow {
  id: string;
  title: string | null;
  description: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  created_at: string;
  incident_type: string;
  device_id: string | null;
  device: { id: string; inventory_number: string; device_type: string; computer_type: string | null } | null;
  employee: { id: string; full_name: string; position: string | null; room: string | null; building: string | null } | null;
  assignee?: { id: string; full_name: string | null } | null;
}

interface IncidentsClientViewProps {
  incidents: IncidentRow[];
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  cancelledCount: number;
  initialSelectedId?: string | null;
}

const tabs: { value: "active" | IncidentStatus; label: string }[] = [
  { value: "active", label: "Активные" },
  { value: "open", label: "Открытые" },
  { value: "in_progress", label: "В работе" },
  { value: "cancelled", label: "Отменённые" },
  { value: "resolved", label: "Архив" },
];

const PRIORITY_ITEMS: Record<string, React.ReactNode> = {
  all: "Все приоритеты",
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  critical: "Критический",
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

export function IncidentsClientView({
  incidents,
  openCount,
  inProgressCount,
  resolvedCount,
  cancelledCount,
  initialSelectedId,
}: IncidentsClientViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const [activeTab, setActiveTab] = useState<"active" | IncidentStatus>("active");
  const [priorityFilter, setPriorityFilter] = useState<"all" | IncidentPriority>("all");
  const [buildingFilter, setBuildingFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  const filteredIncidents = incidents.filter((i) => {
    const matchesStatus =
      activeTab === "active"
        ? i.status !== "resolved"
        : i.status === activeTab;
    const matchesPriority = priorityFilter === "all" || i.priority === priorityFilter;
    const matchesBuilding = buildingFilter === "all" || i.employee?.building === buildingFilter;
    return matchesStatus && matchesPriority && matchesBuilding;
  });

  const selectedIncident = selectedId
    ? incidents.find((i) => i.id === selectedId)
    : null;

  const getCounts = (tab: "active" | IncidentStatus) => {
    const filteredByBuilding = incidents.filter((i) => buildingFilter === "all" || i.employee?.building === buildingFilter);
    if (tab === "active") return filteredByBuilding.filter((i) => i.status !== "resolved").length;
    if (tab === "open") return filteredByBuilding.filter((i) => i.status === "open").length;
    if (tab === "in_progress") return filteredByBuilding.filter((i) => i.status === "in_progress").length;
    if (tab === "resolved") return filteredByBuilding.filter((i) => i.status === "resolved").length;
    if (tab === "cancelled") return filteredByBuilding.filter((i) => i.status === "cancelled").length;
    return 0;
  };

  const handleExportToExcel = () => {
    let exportData = filteredIncidents;

    if (exportStartDate) {
      const start = new Date(exportStartDate);
      start.setHours(0, 0, 0, 0);
      exportData = exportData.filter((inc) => new Date(inc.created_at) >= start);
    }
    if (exportEndDate) {
      const end = new Date(exportEndDate);
      end.setHours(23, 59, 59, 999);
      exportData = exportData.filter((inc) => new Date(inc.created_at) <= end);
    }

    let html = `<table border="1">
      <thead>
        <tr style="background-color: #f3f4f6; font-weight: bold;">
          <th>ID</th>
          <th>Описание</th>
          <th>Приоритет</th>
          <th>Статус</th>
          <th>Тип инцидента</th>
          <th>Устройство (Инв. номер)</th>
          <th>Дата создания</th>
        </tr>
      </thead>
      <tbody>`;

    exportData.forEach((inc) => {
      const priorityText = 
        inc.priority === "low" ? "Низкий" :
        inc.priority === "medium" ? "Средний" :
        inc.priority === "high" ? "Высокий" : "Критический";
      
      const statusText = 
        inc.status === "open" ? "Открыт" :
        inc.status === "in_progress" ? "В работе" :
        inc.status === "resolved" ? "Решен" : "Отменен";

      const typeText = 
        inc.incident_type === "hardware" ? "Аппаратная проблема" :
        inc.incident_type === "software" ? "Программная проблема" :
        inc.incident_type === "network" ? "Сетевая проблема" : "Другое";

      const deviceText = inc.device
        ? `[${deviceTypeRussianLabels[inc.device.device_type] || "Устройство"}] ${inc.device.computer_type || ""} (${inc.device.inventory_number})`
        : "—";
      const dateText = new Date(inc.created_at).toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });

      html += `<tr>
        <td>#T${inc.id.slice(0, 4)}</td>
        <td>${inc.description}</td>
        <td>${priorityText}</td>
        <td>${statusText}</td>
        <td>${typeText}</td>
        <td>${deviceText}</td>
        <td>${dateText}</td>
      </tr>`;
    });

    html += `</tbody></table>`;

    const blob = new Blob(["\ufeff" + html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `incidents_report_${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderExportDialog = () => (
    <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Экспорт отчета в Excel</DialogTitle>
          <DialogDescription>
            Выберите диапазон дат для фильтрации инцидентов в отчете. Оставьте поля пустыми, чтобы выгрузить за всё время.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="export-start-date" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Дата начала</Label>
            <Input
              id="export-start-date"
              type="date"
              value={exportStartDate}
              onChange={(e) => setExportStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="export-end-date" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Дата окончания</Label>
            <Input
              id="export-end-date"
              type="date"
              value={exportEndDate}
              onChange={(e) => setExportEndDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setExportStartDate("");
              setExportEndDate("");
            }}
          >
            Сбросить
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => {
              handleExportToExcel();
              setExportDialogOpen(false);
            }}
          >
            Скачать XLS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (selectedIncident) {
    // Master-Detail mode
    return (
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left: Compact list */}
          <div className="hidden lg:block lg:w-1/3 space-y-2 lg:overflow-y-auto lg:max-h-[calc(100vh-200px)] pr-1 custom-scrollbar">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Select
                value={buildingFilter}
                onValueChange={(val) => setBuildingFilter(val ?? "all")}
              >
                <SelectTrigger className="w-full h-8 text-xs bg-white">
                  <SelectValue placeholder="Все корпуса" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все корпуса</SelectItem>
                  {Object.keys(BUILDING_ADDRESSES).map((building) => (
                    <SelectItem key={building} value={building}>{building}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={priorityFilter}
                onValueChange={(v) => setPriorityFilter(v as "all" | IncidentPriority)}
              >
                <SelectTrigger className="w-full h-8 text-xs bg-white">
                  <SelectValue placeholder="Все приоритеты" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_ITEMS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {filteredIncidents.map((inc) => (
              <button
                key={inc.id}
                onClick={() => setSelectedId(inc.id)}
                className={cn(
                  "w-full p-3 rounded-lg text-left transition-colors",
                  inc.id === selectedId ? "bg-white shadow-sm" : "bg-gray-100 hover:bg-gray-200"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400 font-mono">#T{inc.id.slice(0, 4)}</span>
                  <PriorityBadge priority={inc.priority} />
                  <IncidentStatusBadge status={inc.status} />
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                  <DecompressedText text={inc.title || inc.description} truncate={80} />
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span>
                    {inc.device
                      ? `${deviceTypeEmojis[inc.device.device_type] || "🔌"} ${inc.device.inventory_number}`
                      : "—"}
                  </span>
                  {inc.status === "resolved" && (
                    <>
                      <span>·</span>
                      <span className="text-emerald-600 font-medium">Решено кем: {inc.assignee?.full_name ?? "IT-специалист"}</span>
                    </>
                  )}
                </p>
              </button>
            ))}
          </div>

          {/* Right: Detail panel */}
          <div className="w-full lg:w-2/3 rounded-xl bg-white shadow-sm p-4 md:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">#T{selectedIncident.id.slice(0, 4)}</span>
                <PriorityBadge priority={selectedIncident.priority} />
                <IncidentStatusBadge status={selectedIncident.status} />
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedIncident.title || "Инцидент IT"}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedIncident.incident_type === "hardware" ? "Аппаратная проблема" :
                 selectedIncident.incident_type === "software" ? "Программная проблема" :
                 selectedIncident.incident_type === "network" ? "Сетевая проблема" : "Другое"}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Описание</h4>
              <DecompressedText text={selectedIncident.description} className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Monitor className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Устройство</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedIncident.device ? (
                    <>
                      {deviceTypeEmojis[selectedIncident.device.device_type] || "🔌"}{" "}
                      {deviceTypeRussianLabels[selectedIncident.device.device_type] || "Устройство"}{" "}
                      {selectedIncident.device.computer_type && `${selectedIncident.device.computer_type} `}
                      ({selectedIncident.device.inventory_number})
                    </>
                  ) : "—"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Сотрудник</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedIncident.employee?.full_name ?? "Не указан"}
                  {selectedIncident.employee?.room && ` (Каб. ${selectedIncident.employee.room})`}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Создан</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{formatDateTime(selectedIncident.created_at)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Приоритет</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedIncident.priority === "critical" ? "Критический" :
                   selectedIncident.priority === "high" ? "Высокий" :
                   selectedIncident.priority === "medium" ? "Средний" : "Низкий"}
                </p>
              </div>
              {selectedIncident.status === "resolved" && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Решено кем</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedIncident.assignee?.full_name ?? "IT-специалист"}
                  </p>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">ИЗМЕНИТЬ СТАТУС</h3>
              <div className="flex flex-wrap items-center gap-3">
                {selectedIncident.status === "open" && (
                  <button
                    onClick={() => { startTransition(async () => { await updateIncidentStatus(selectedIncident.id, "in_progress"); }); }}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>🕐</span>}
                    {isPending ? "Выполнение…" : "Взять в работу"}
                  </button>
                )}
                {selectedIncident.status === "in_progress" && (
                  <button
                    onClick={() => { startTransition(async () => { await updateIncidentStatus(selectedIncident.id, "resolved"); }); }}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {isPending ? "Закрытие…" : "Отметить исправленным"}
                  </button>
                )}
                {selectedIncident.status === "resolved" && (
                  <span className="text-sm text-green-600 font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Инцидент решён
                  </span>
                )}
                <Link
                  href={`/incidents/${selectedIncident.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" }) + " gap-2"}
                >
                  Подробнее
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button
            onClick={() => setExportDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white gap-2 text-sm font-medium h-9 rounded-lg"
          >
            Экспорт в XLS
          </Button>
        </div>
        {renderExportDialog()}
      </div>
    );
  }

  // Default mode: list with tabs
  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 overflow-x-auto max-w-full">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0 whitespace-nowrap",
                activeTab === tab.value
                  ? "bg-[#2563eb] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {tab.label} {getCounts(tab.value)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {/* Building Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Корпус:</span>
            <Select
              value={buildingFilter}
              onValueChange={(val) => setBuildingFilter(val ?? "all")}
            >
              <SelectTrigger className="w-[180px] h-9 bg-white text-xs">
                <SelectValue placeholder="Все корпуса" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все корпуса</SelectItem>
                {Object.keys(BUILDING_ADDRESSES).map((building) => (
                  <SelectItem key={building} value={building}>{building}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Приоритет:</span>
            <Select
              value={priorityFilter}
              onValueChange={(v) => setPriorityFilter(v as "all" | IncidentPriority)}
            >
              <SelectTrigger className="w-[140px] h-9 bg-white">
                <SelectValue placeholder="Все приоритеты" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все приоритеты</SelectItem>
                <SelectItem value="low">Низкий</SelectItem>
                <SelectItem value="medium">Средний</SelectItem>
                <SelectItem value="high">Высокий</SelectItem>
                <SelectItem value="critical">Критический</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Incident cards */}
      <div className="max-h-[600px] overflow-y-auto pr-1 custom-scrollbar space-y-2">
        {filteredIncidents.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <AlertTriangle className="w-10 h-10 mx-auto opacity-40 mb-3" />
            <p className="text-sm">Инцидентов нет</p>
          </div>
        ) : (
          filteredIncidents.map((inc) => (
            <button
              key={inc.id}
              onClick={() => setSelectedId(inc.id)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400 font-mono">#T{inc.id.slice(0, 4)}</span>
                  <PriorityBadge priority={inc.priority} />
                  <IncidentStatusBadge status={inc.status} />
                </div>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  <DecompressedText text={inc.title || inc.description} truncate={100} />
                </p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>
                    {inc.device
                      ? `${deviceTypeEmojis[inc.device.device_type] || "🔌"} ${inc.device.inventory_number}`
                      : "—"}
                  </span>
                  <span>·</span>
                  <span>{formatDateTime(inc.created_at)}</span>
                  {inc.status === "resolved" && (
                    <>
                      <span>·</span>
                      <span className="text-emerald-600 font-medium">Решено кем: {inc.assignee?.full_name ?? "IT-специалист"}</span>
                    </>
                  )}
                </p>
              </div>
              <span className="text-gray-400 ml-4">›</span>
            </button>
          ))
        )}
      </div>

      {/* Export to XLS Button */}
      <div className="flex justify-end mt-4">
        <Button
          onClick={() => setExportDialogOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white gap-2 text-sm font-medium h-9 rounded-lg"
        >
          Экспорт в XLS
        </Button>
      </div>
      {renderExportDialog()}
    </div>
  );
}