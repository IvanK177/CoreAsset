"use client";

import { useState } from "react";
import { Monitor, Plus, AlertTriangle, CheckCircle2, Cpu, HardDrive, MemoryStick } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ComputerStatusBadge, IncidentStatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { NewTicketDialog } from "@/components/portal/NewTicketDialog";
import { IncidentDetailsDialog } from "@/components/portal/IncidentDetailsDialog";

interface ComputerData {
  id: string;
  inventory_number: string;
  computer_type: string | null;
  lifecycle_status: string;
  room: string | null;
  hardware: unknown;
  employee_id: string | null;
}

interface ComputerOption {
  id: string;
  inventory_number: string;
  computer_type: string | null;
}

interface IncidentData {
  id: string;
  title: string | null;
  description: string;
  priority: string;
  status: string;
  incident_type: string;
  created_at: string;
  computer_id: string | null;
  computer?: {
    inventory_number: string | null;
    computer_type: string | null;
  } | {
    inventory_number: string | null;
    computer_type: string | null;
  }[] | null;
}

interface PortalClientViewProps {
  employeeId: string;
  employeeName: string;
  employeePosition: string;
  computers: ComputerData[];
  allComputers: ComputerOption[];
  incidents: IncidentData[];
  openIncidents: number;
  resolvedIncidents: number;
}

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
  employeePosition,
  computers,
  allComputers,
  incidents,
  openIncidents,
  resolvedIncidents,
}: PortalClientViewProps) {
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<IncidentData | null>(null);

  const firstName = employeeName.split(" ")[0] ?? employeeName;

  return (
    <div className="space-y-6">
      {/* ===== Block 1: Welcome Banner ===== */}
      <div className="rounded-2xl bg-blue-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">Привет, {firstName}!</h1>
            <p className="text-blue-100 text-sm mb-4">
              Есть проблема с компьютером? Создайте заявку и мы разберёмся.
            </p>
            <button
              onClick={() => setTicketDialogOpen(true)}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-white text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Создать заявку
            </button>
          </div>
          <div className="flex flex-col items-center gap-1 ml-6">
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold">{openIncidents}</span>
              <span className="text-blue-200 text-xs">Открытых заявок</span>
            </div>
            <span className="text-blue-300 text-xs">
              {resolvedIncidents} решено
            </span>
          </div>
        </div>
      </div>

      {/* ===== Block 2: My Workplaces ===== */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Мои рабочие места ({computers.length})
        </h2>

        {computers.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            Нет привязанных компьютеров
          </p>
        ) : (
          <div className="space-y-3">
            {computers.map((comp) => {
              const hw = (comp.hardware as Record<string, string> | null) ?? null;
              return (
                <div
                  key={comp.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
                >
                  {/* Icon */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 shrink-0">
                    <Monitor className="w-5 h-5 text-blue-600" />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">
                        {comp.inventory_number}
                      </span>
                      <ComputerStatusBadge status={comp.lifecycle_status as "active" | "repair" | "decommissioned" | "storage"} />
                      <span className="text-xs text-gray-500">
                        {computerTypeLabels[comp.computer_type ?? ""] ?? comp.computer_type ?? "—"}
                        {comp.room && ` · каб. ${comp.room}`}
                      </span>
                    </div>
                    {/* Hardware specs */}
                    {hw && (
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== Block 3: My Tickets ===== */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Мои заявки ({incidents.length})
        </h2>

        {incidents.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            Нет созданных заявок
          </p>
        ) : (
          <div className="space-y-3">
            {incidents.map((incident) => {
              const isOpen = incident.status === "open" || incident.status === "in_progress";
              return (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-300 hover:bg-blue-50/10 cursor-pointer transition-all duration-150"
                >
                  {/* Status icon */}
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                    isOpen
                      ? "bg-yellow-100"
                      : "bg-emerald-100"
                  )}>
                    {isOpen
                      ? <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      : <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    }
                  </div>

                  {/* Ticket info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400">
                        {getIncidentNumber(incident)}
                      </span>
                      <span className="font-medium text-sm text-gray-900 truncate">
                        {getIncidentTitle(incident)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 mt-0.5">
                      {formatDate(incident.created_at)}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={incident.priority as "low" | "medium" | "high" | "critical"} />
                    <IncidentStatusBadge status={incident.status as "open" | "in_progress" | "resolved"} />
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
        computers={allComputers}
      />

      {/* ===== Incident Details Dialog ===== */}
      <IncidentDetailsDialog
        open={!!selectedIncident}
        onOpenChange={(open) => !open && setSelectedIncident(null)}
        incident={selectedIncident}
      />
    </div>
  );
}