"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { formatDateTime, extractJoinObject } from "@/lib/utils";
import { Calendar, Monitor, Wrench, User, FileText, CheckCircle } from "lucide-react";
import { DecompressedText } from "@/components/shared/DecompressedText";

interface RelatedEmployee {
  full_name: string | null;
  room: string | null;
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

interface ITPortalIncidentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident: IncidentRow | null;
}

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

export function ITPortalIncidentDetailsDialog({
  open,
  onOpenChange,
  incident,
}: ITPortalIncidentDetailsDialogProps) {
  if (!incident) return null;

  const title = incident.title || "Заявка без темы";
  const shortId = incident.id.substring(0, 8);
  const typeLabel = incidentTypeLabels[incident.incident_type] ?? incident.incident_type;

  // Safe extract relations
  const emp = extractJoinObject(incident.employee) as RelatedEmployee | null;
  const comp = extractJoinObject(incident.computer) as RelatedComputer | null;
  const assignee = extractJoinObject(incident.assignee) as { full_name: string | null } | null;

  const employeeName = emp?.full_name ?? "Не указан";
  const employeeRoom = emp?.room ? `Каб. ${emp.room}` : null;

  const computerInfo = comp?.inventory_number
    ? `${comp.inventory_number} (${computerTypeLabels[comp.computer_type ?? ""] ?? comp.computer_type ?? "—"})`
    : null;

  const resolvedBy = assignee?.full_name ?? "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-white rounded-2xl p-6 border-none shadow-2xl">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              #T{shortId}
            </span>
            <IncidentStatusBadge status={incident.status as "open" | "in_progress" | "resolved"} />
            <PriorityBadge priority={incident.priority as "low" | "medium" | "high" | "critical"} />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900 leading-snug">
            {title}
          </DialogTitle>
          <DialogDescription className="hidden">
            Детали инцидента #{shortId}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50/70 border border-gray-100/80 text-sm">
            {/* Reporter */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-400 block">Отправитель</span>
              <div className="flex items-center gap-1.5 font-medium text-gray-700">
                <User className="w-4 h-4 text-blue-500 shrink-0" />
                <span>{employeeName} {employeeRoom ? `(${employeeRoom})` : ""}</span>
              </div>
            </div>

            {/* Date Created */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-400 block">Создана</span>
              <div className="flex items-center gap-1.5 font-medium text-gray-700">
                <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{formatDateTime(incident.created_at)}</span>
              </div>
            </div>

            {/* Type */}
            <div className="space-y-1 pt-2 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-400 block">Тип проблемы</span>
              <div className="flex items-center gap-1.5 font-medium text-gray-700">
                <Wrench className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{typeLabel}</span>
              </div>
            </div>

            {/* Resolved Date */}
            <div className="space-y-1 pt-2 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-400 block">Закрыта</span>
              <div className="flex items-center gap-1.5 font-medium text-gray-700">
                <CheckCircle className="w-4 h-4 text-violet-500 shrink-0" />
                <span>{incident.resolved_at ? formatDateTime(incident.resolved_at) : "—"}</span>
              </div>
            </div>

            {/* Resolved By */}
            {incident.status === "resolved" && (
              <div className="space-y-1 pt-2 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-400 block">Решено кем</span>
                <div className="flex items-center gap-1.5 font-medium text-gray-700">
                  <User className="w-4 h-4 text-violet-500 shrink-0" />
                  <span>{resolvedBy}</span>
                </div>
              </div>
            )}

            {/* Device */}
            <div className="col-span-2 space-y-1 pt-2 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-400 block">Устройство / Оборудование</span>
              <div className="flex items-center gap-1.5 font-medium text-gray-700">
                <Monitor className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className={computerInfo ? "font-mono" : "text-gray-400"}>
                  {computerInfo ?? "Устройство не привязано"}
                </span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Описание инцидента
            </span>
            <div className="p-4 rounded-xl bg-white border border-gray-100 max-h-[220px] overflow-y-auto shadow-inner-sm">
              <DecompressedText text={incident.description} className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-3">
          <button
            onClick={() => onOpenChange(false)}
            className="h-10 px-5 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
