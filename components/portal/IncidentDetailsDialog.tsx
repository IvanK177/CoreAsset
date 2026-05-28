"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { formatDate, extractJoinObject } from "@/lib/utils";
import { Calendar, Monitor, Wrench, AlertTriangle, FileText, XCircle, Loader2 } from "lucide-react";
import { cancelPortalIncident } from "@/lib/actions/portal";

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

interface IncidentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident: IncidentData | null;
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

export function IncidentDetailsDialog({
  open,
  onOpenChange,
  incident,
}: IncidentDetailsDialogProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!incident) return null;

  const title = incident.title || "Заявка без темы";
  const shortId = incident.id.substring(0, 8);
  const typeLabel = incidentTypeLabels[incident.incident_type] ?? incident.incident_type;

  // Safe extract computer join object
  const computer = extractJoinObject(incident.computer) as {
    inventory_number: string | null;
    computer_type: string | null;
  } | null;

  const computerInfo = computer?.inventory_number
    ? `${computer.inventory_number} (${computerTypeLabels[computer.computer_type ?? ""] ?? computer.computer_type ?? "—"})`
    : null;

  const handleCancel = () => {
    if (!confirm("Вы уверены, что хотите отменить эту заявку?")) return;

    startTransition(async () => {
      const result = await cancelPortalIncident(incident.id);
      if (result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Заявка успешно отменена");
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white rounded-2xl p-6 border-none shadow-2xl">
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
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-400 block">Тип проблемы</span>
              <div className="flex items-center gap-1.5 font-medium text-gray-700">
                <Wrench className="w-4 h-4 text-blue-500 shrink-0" />
                <span>{typeLabel}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-400 block">Дата создания</span>
              <div className="flex items-center gap-1.5 font-medium text-gray-700">
                <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{formatDate(incident.created_at)}</span>
              </div>
            </div>

            <div className="col-span-2 space-y-1 pt-1 border-t border-gray-100">
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
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {incident.description}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div>
            {incident.status === "open" && (
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="h-10 px-4 rounded-lg bg-red-50 text-red-600 border border-red-100 font-medium text-sm hover:bg-red-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin animate-infinite" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Отменить заявку
              </button>
            )}
          </div>
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
