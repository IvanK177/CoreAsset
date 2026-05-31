"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Clock, Loader2, Monitor, User, Wrench, Building, X } from "lucide-react";
import { cn, extractJoinObject, BUILDING_ADDRESSES } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { DecompressedText } from "@/components/shared/DecompressedText";
import { takeIncidentToWork, resolveIncident } from "@/lib/actions/it-portal";
import { ITPortalIncidentDetailsDialog } from "./ITPortalIncidentDetailsDialog";

/* ── Types ── */

interface RelatedEmployee {
  full_name: string | null;
  room: string | null;
  building: string | null;
}

interface RelatedComputer {
  inventory_number: string | null;
  computer_type: string | null;
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
  computer: RelatedComputer | RelatedComputer[] | null;
  assignee?: { full_name: string | null } | { full_name: string | null }[] | null;
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

const computerTypeLabels: Record<string, string> = {
  desktop: "PC",
  laptop: "Laptop",
  monoblock: "Monoblock",
  server: "Server",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function getComputerInfo(incident: IncidentRow): string {
  if (!incident.computer) return "";
  const comp = Array.isArray(incident.computer) ? incident.computer[0] : incident.computer;
  if (!comp?.inventory_number) return "";
  const typeLabel = computerTypeLabels[comp.computer_type ?? ""] ?? comp.computer_type ?? "";
  return `${comp.inventory_number}${typeLabel ? ` (${typeLabel})` : ""}`;
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

  const handleResolve = (incidentId: string) => {
    setPendingId(incidentId);
    startTransition(async () => {
      await resolveIncident(incidentId);
      setPendingId(null);
    });
  };

  const filteredByBuilding = incidents.filter((i) => {
    if (buildingFilter === "all") return true;
    const emp = Array.isArray(i.employee) ? i.employee[0] : i.employee;
    return emp && emp.building === buildingFilter;
  });

  const openCountVal = isMyTasks ? 0 : isArchive ? 0 : filteredByBuilding.filter(i => i.status === "open").length;
  const inProgressCountVal = isArchive ? 0 : filteredByBuilding.filter(i => i.status === "in_progress").length;
  const resolvedCountVal = isMyTasks
    ? filteredByBuilding.filter(i => i.status === "resolved").length
    : isArchive
      ? filteredByBuilding.length
      : filteredByBuilding.filter(i => i.status === "resolved").length;

  const displayIncidents = filteredByBuilding.filter((i) => {
    if (isArchive) {
      return i.status === "resolved";
    }
    return i.status !== "resolved";
  });

  if (selectedIncident) {
    // Master-Detail mode
    return (
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left: Compact list */}
          <div className="hidden lg:block lg:w-1/3 space-y-2 lg:overflow-y-auto lg:max-h-[calc(100vh-200px)] pr-1 custom-scrollbar">
            {displayIncidents.map((inc) => (
              <button
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={cn(
                  "w-full p-3 rounded-lg text-left transition-colors cursor-pointer",
                  inc.id === selectedIncident.id ? "bg-white shadow-sm" : "bg-gray-105 hover:bg-gray-200"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400 font-mono">{getIncidentNumber(inc)}</span>
                  <PriorityBadge priority={inc.priority as "low" | "medium" | "high" | "critical"} />
                  <IncidentStatusBadge status={inc.status as "open" | "in_progress" | "resolved" | "cancelled"} />
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{getIncidentTitle(inc)}</p>
                <p className="text-xs text-gray-505 flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span>{getComputerInfo(inc) || "—"}</span>
                </p>
              </button>
            ))}
          </div>

          {/* Right: Detail panel */}
          <div className="w-full lg:w-2/3 rounded-xl bg-white shadow-sm p-4 md:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">{getIncidentNumber(selectedIncident)}</span>
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
                    <p className="text-sm font-semibold text-gray-800">{getComputerInfo(selectedIncident) || "Нет привязанного устройства"}</p>
                  </div>
                </div>
              </div>
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
                    handleResolve(selectedIncident.id);
                    setSelectedIncident(null);
                  }}
                >
                  Решено
                </Button>
              )}
            </div>
          </div>
        </div>
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
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-400">
                              {getIncidentNumber(incident)}
                            </span>
                            <span className="font-medium text-sm text-gray-900 truncate">
                              {getIncidentTitle(incident)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            {/* Author */}
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-gray-400" />
                              {getEmployeeName(incident)}
                            </span>
                            {/* Computer */}
                            {getComputerInfo(incident) && (
                              <span className="flex items-center gap-1">
                                <Monitor className="w-3 h-3 text-gray-400" />
                                {getComputerInfo(incident)}
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
                              handleResolve(incident.id);
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
              <p className="text-xs text-gray-505 mt-1 leading-relaxed">Регламент исправления инцидентов по приоритетам</p>
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
    </div>
  );
}