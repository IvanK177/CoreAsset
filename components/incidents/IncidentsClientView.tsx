"use client";

import { useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";
import { updateIncidentStatus } from "@/lib/actions/incidents";
import { X, AlertTriangle, Monitor, Users, Calendar, CheckCircle } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

type IncidentStatus = "open" | "in_progress" | "resolved";
type IncidentPriority = "low" | "medium" | "high" | "critical";

interface IncidentRow {
  id: string;
  description: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  created_at: string;
  incident_type: string;
  computer_id: string | null;
  computer: { id: string; inventory_number: string } | null;
  employee: { id: string; full_name: string; position: string | null } | null;
}

interface IncidentsClientViewProps {
  incidents: IncidentRow[];
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  initialSelectedId?: string | null;
}

const tabs: { value: "all" | IncidentStatus; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "open", label: "Открытые" },
  { value: "in_progress", label: "В работе" },
  { value: "resolved", label: "Исправленные" },
];

export function IncidentsClientView({
  incidents,
  openCount,
  inProgressCount,
  resolvedCount,
  initialSelectedId,
}: IncidentsClientViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const [activeTab, setActiveTab] = useState<"all" | IncidentStatus>("all");

  const filteredIncidents = activeTab === "all"
    ? incidents
    : incidents.filter((i) => i.status === activeTab);

  const selectedIncident = selectedId
    ? incidents.find((i) => i.id === selectedId)
    : null;

  const getCounts = (tab: "all" | IncidentStatus) => {
    if (tab === "all") return incidents.length;
    if (tab === "open") return openCount;
    if (tab === "in_progress") return inProgressCount;
    if (tab === "resolved") return resolvedCount;
    return 0;
  };

  if (selectedIncident) {
    // Master-Detail mode
    return (
      <div className="flex gap-4">
        {/* Left: Compact list */}
        <div className="w-1/3 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
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
              <p className="text-sm font-medium text-gray-900 truncate">{inc.description}</p>
              <p className="text-xs text-gray-500">{inc.computer?.inventory_number ?? "—"}</p>
            </button>
          ))}
        </div>

        {/* Right: Detail panel */}
        <div className="w-2/3 rounded-xl bg-white shadow-sm p-6 space-y-5">
          {/* Header with badges and close button */}
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

          {/* Title and description */}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{selectedIncident.description}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {selectedIncident.incident_type === "hardware" ? "Аппаратная проблема" :
               selectedIncident.incident_type === "software" ? "Программная проблема" :
               selectedIncident.incident_type === "network" ? "Сетевая проблема" : "Другое"}
            </p>
          </div>

          {/* Info grid 2x2 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Monitor className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Компьютер</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {selectedIncident.computer?.inventory_number ?? "—"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Сотрудник</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {selectedIncident.employee?.full_name ?? "Не указан"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Создан</span>
              </div>
              <p className="text-sm font-medium text-gray-900">{formatDate(selectedIncident.created_at)}</p>
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
          </div>

          {/* Change Status */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">ИЗМЕНИТЬ СТАТУС</h3>
            <div className="flex items-center gap-3">
              {selectedIncident.status === "open" && (
                <button
                  onClick={() => { updateIncidentStatus(selectedIncident.id, "in_progress"); setSelectedId(null); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
                >
                  🕐 Взять в работу
                </button>
              )}
              {selectedIncident.status === "in_progress" && (
                <button
                  onClick={() => { updateIncidentStatus(selectedIncident.id, "resolved"); setSelectedId(null); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Отметить исправленным
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
    );
  }

  // Default mode: list with tabs
  return (
    <div className="space-y-4">
      {/* Counters */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-600">⚠ {openCount} открытых</span>
        <span className="text-gray-600">🕐 {inProgressCount} в работе</span>
        <span className="text-gray-600">✅ {resolvedCount} решено</span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === tab.value
                ? "bg-[#2563eb] text-white"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {tab.label} {getCounts(tab.value)}
          </button>
        ))}
      </div>

      {/* Incident cards */}
      <div className="space-y-2">
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
                <p className="text-sm font-semibold text-gray-900 truncate">{inc.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {inc.computer?.inventory_number ?? "—"} · {formatDate(inc.created_at)}
                </p>
              </div>
              <span className="text-gray-400 ml-4">›</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}