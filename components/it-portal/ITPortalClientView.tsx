"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Clock, Loader2, Monitor, User, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { takeIncidentToWork, resolveIncident } from "@/lib/actions/it-portal";

/* ── Types ── */

interface RelatedEmployee {
  full_name: string | null;
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
}

interface ITPortalClientViewProps {
  specialistId: string;
  incidents: IncidentRow[];
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
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
  // Supabase JOIN can return a single object or array
  const emp = Array.isArray(incident.employee) ? incident.employee[0] : incident.employee;
  return emp?.full_name ?? "—";
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
  openCount,
  inProgressCount,
  resolvedCount,
  currentPath,
}: ITPortalClientViewProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isMyTasks = currentPath === "/it-portal/my-tasks";

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

  return (
    <div className="space-y-6">
      {/* ===== Header Banner ===== */}
      <div className="rounded-2xl bg-blue-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">
              {isMyTasks ? "Мои задачи" : "Биржа заявок"}
            </h1>
            <p className="text-blue-100 text-sm">
              {isMyTasks
                ? "Заявки, которые вы взяли в работу."
                : "Все входящие заявки от сотрудников. Берите в работу и решайте."}
            </p>
          </div>
          <div className="flex items-center gap-6 ml-6">
            {!isMyTasks && (
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold">{openCount}</span>
                <span className="text-blue-200 text-xs">Открытых</span>
              </div>
            )}
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">{inProgressCount}</span>
              <span className="text-blue-200 text-xs">В работе</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">{resolvedCount}</span>
              <span className="text-blue-200 text-xs">Решено</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Ticket List ===== */}
      {incidents.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 shadow-sm border border-gray-100 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {isMyTasks ? "Нет задач в работе" : "Нет заявок"}
          </h3>
          <p className="text-sm text-gray-500">
            {isMyTasks
              ? "Вы ещё не взяли ни одной заявки. Перейдите на «Биржу заявок», чтобы начать."
              : "Все заявки обработаны. Отличная работа!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => {
            const isOpen = incident.status === "open";
            const isInProgress = incident.status === "in_progress";
            const isResolved = incident.status === "resolved";
            const isAssignedToMe = incident.assigned_to === specialistId;
            const isActionPending = pendingId === incident.id;

            return (
              <div
                key={incident.id}
                className={cn(
                  "rounded-2xl bg-white p-5 shadow-sm border transition-all duration-150",
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
                        <User className="w-3 h-3" />
                        {getEmployeeName(incident)}
                      </span>
                      {/* Computer */}
                      {getComputerInfo(incident) && (
                        <span className="flex items-center gap-1">
                          <Monitor className="w-3 h-3" />
                          {getComputerInfo(incident)}
                        </span>
                      )}
                      {/* Type */}
                      <span className="flex items-center gap-1">
                        <Wrench className="w-3 h-3" />
                        {incidentTypeLabels[incident.incident_type] ?? incident.incident_type}
                      </span>
                      {/* Date */}
                      <span>{formatDate(incident.created_at)}</span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={incident.priority as "low" | "medium" | "high" | "critical"} />
                    <IncidentStatusBadge status={incident.status as "open" | "in_progress" | "resolved"} />
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
                    {incident.description.substring(0, 150)}
                    {incident.description.length > 150 ? "…" : ""}
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 pl-12">
                  {isOpen && (
                    <Button
                      size="sm"
                      className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isActionPending}
                      onClick={() => handleTakeToWork(incident.id)}
                    >
                      {isActionPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                      Взять в работу
                    </Button>
                  )}
                  {isInProgress && isAssignedToMe && (
                    <Button
                      size="sm"
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={isActionPending}
                      onClick={() => handleResolve(incident.id)}
                    >
                      {isActionPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Решено
                    </Button>
                  )}
                  {isResolved && incident.resolved_at && (
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Решено {formatDate(incident.resolved_at)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}