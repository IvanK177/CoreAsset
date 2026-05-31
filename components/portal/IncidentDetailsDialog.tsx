"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { formatDateTimeRu, extractJoinObject } from "@/lib/utils";
import { Calendar, Monitor, Wrench, FileText, XCircle, Loader2, User, CheckCircle, Cpu, Keyboard, Mouse, Printer, HelpCircle, X } from "lucide-react";
import { cancelPortalIncident } from "@/lib/actions/portal";
import { DecompressedText } from "@/components/shared/DecompressedText";

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
    computer_type: string | null; // DB column name used as Subtype/Model name
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

const deviceTypeLabels: Record<string, string> = {
  pc: "Компьютер",
  monitor: "Монитор",
  keyboard: "Клавиатура",
  mouse: "Мышь",
  printer: "Принтер",
  other: "Устройство",
};

export function IncidentDetailsDialog({
  open,
  onOpenChange,
  incident,
}: IncidentDetailsDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const router = useRouter();

  if (!incident) return null;

  const title = incident.title || "Заявка без темы";
  const shortId = incident.id.substring(0, 8);
  const typeLabel = incidentTypeLabels[incident.incident_type] ?? incident.incident_type;

  // Safe extract device join object
  const device = extractJoinObject(incident.device) as {
    inventory_number: string | null;
    computer_type: string | null;
    device_type: string | null;
  } | null;

  const deviceTypeDisplay = device?.device_type ? deviceTypeLabels[device.device_type] || "Устройство" : "Устройство";
  const deviceInfo = device?.inventory_number
    ? `[${deviceTypeDisplay}] ${device.computer_type ?? "—"} (${device.inventory_number})`
    : null;

  const assignee = extractJoinObject(incident.assignee) as { full_name: string | null } | null;
  const resolvedBy = assignee?.full_name ?? "IT-специалист";

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
      <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 border-none shadow-2xl">
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
                <span>{formatDateTimeRu(incident.created_at)}</span>
              </div>
            </div>

            {incident.status === "resolved" && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-gray-400 block">Решено кем</span>
                <div className="flex items-center gap-1.5 font-medium text-gray-700">
                  <User className="w-4 h-4 text-violet-500 shrink-0" />
                  <span>{resolvedBy}</span>
                </div>
              </div>
            )}

            <div className="col-span-2 space-y-1 pt-1 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-400 block">Устройство / Оборудование</span>
              <div className="flex items-center gap-1.5 font-medium text-gray-700">
                <Monitor className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className={deviceInfo ? "font-medium" : "text-gray-400"}>
                  {deviceInfo ?? "Устройство не привязано"}
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

          {/* Attached Photos */}
          {incident.photo_urls && incident.photo_urls.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Фотографии ({incident.photo_urls.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {incident.photo_urls.map((url, idx) => (
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

          {/* IT Specialist Resolution */}
          {incident.status === "resolved" && incident.resolution && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Что было сделано (Решение)
              </span>
              <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100 max-h-[220px] overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {incident.resolution}
                </p>
              </div>
            </div>
          )}
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
      </DialogContent>
    </Dialog>
  );
}
