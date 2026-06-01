export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";
import { deleteIncident, updateIncidentStatus } from "@/lib/actions/incidents";
import { formatDateTimeRu, extractJoinObject } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { SubmitButton } from "@/components/shared/SubmitButton";
import Link from "next/link";
import { getIncidentMessages, getCurrentEmployee } from "@/lib/actions/messages";
import { TicketChat } from "@/components/TicketChat";

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

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: inc } = await supabase
    .from("incidents")
    .select("*, devices!incidents_device_id_fkey(id, inventory_number, device_type, computer_type), employees!incidents_employee_id_fkey(id, full_name, position, room), assignee:employees!incidents_assigned_to_fkey(full_name)")
    .eq("id", id)
    .single();

  if (!inc) notFound();

  const messages = await getIncidentMessages(id);
  const currentEmployee = await getCurrentEmployee();
  const currentUserId = currentEmployee?.id ?? "";

  const device = extractJoinObject(inc.devices as unknown) as { id: string; inventory_number: string; device_type: string; computer_type: string | null } | null;
  const employee = extractJoinObject(inc.employees as unknown) as { id: string; full_name: string; position: string | null; room: string | null } | null;
  const assignee = extractJoinObject(inc.assignee as unknown) as { full_name: string | null } | null;
  const isResolved = inc.status === "resolved";
  const resolvedBy = assignee?.full_name ?? "IT-специалист";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <AlertTriangle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Тикет #{id.slice(0, 8)}</h1>
            <p className="text-sm text-muted-foreground capitalize">{inc.incident_type}</p>
          </div>
          <div className="flex gap-2">
            <PriorityBadge priority={inc.priority as "low" | "medium" | "high" | "critical"} />
            <IncidentStatusBadge status={inc.status as "open" | "in_progress" | "resolved" | "cancelled"} />
          </div>
        </div>
        <DeleteConfirmDialog
          onConfirm={async () => { "use server"; await deleteIncident(id); }}
          description="Тикет будет удалён безвозвратно."
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Детали</p>
        <Row label="Устройство" value={
          device ? (
            <Link href={`/devices/${device.id}`} className="text-primary hover:underline">
              {deviceTypeEmojis[device.device_type] || "🔌"} {deviceTypeRussianLabels[device.device_type] || "Устройство"}{" "}
              {device.computer_type && `${device.computer_type} `}({device.inventory_number})
            </Link>
          ) : "—"
        } />
        <Row label="Сотрудник" value={
          employee ? (
            <Link href={`/employees/${employee.id}`} className="text-primary hover:underline">
              {employee.full_name}{employee.room ? ` (Каб. ${employee.room})` : ""}
            </Link>
          ) : "Не указан"
        } />
        <Row label="Создан" value={formatDateTimeRu(inc.created_at)} />
        {inc.resolved_at && <Row label="Закрыт" value={formatDateTimeRu(inc.resolved_at)} />}
        {isResolved && <Row label="Решено кем" value={resolvedBy} />}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Описание</p>
        <p className="text-sm whitespace-pre-wrap">{inc.description}</p>
      </div>

      {inc.photo_urls && inc.photo_urls.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Фотографии к заявке</p>
          <div className="grid grid-cols-3 gap-2">
            {inc.photo_urls.map((url: string, idx: number) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-video rounded-lg overflow-hidden border border-gray-100 hover:opacity-90 transition-opacity"
              >
                <img
                  src={url}
                  alt={`Вложение ${idx + 1}`}
                  className="object-cover w-full h-full"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {isResolved && inc.resolution && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-3">Что сделано (Решение)</p>
          <p className="text-sm whitespace-pre-wrap text-emerald-900">{inc.resolution}</p>
        </div>
      )}

      {isResolved && inc.resolution_photo_urls && inc.resolution_photo_urls.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Фотоотчет выполненной работы</p>
          <div className="grid grid-cols-3 gap-2">
            {inc.resolution_photo_urls.map((url: string, idx: number) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-video rounded-lg overflow-hidden border border-emerald-100 hover:opacity-90 transition-opacity"
              >
                <img
                  src={url}
                  alt={`Решение ${idx + 1}`}
                  className="object-cover w-full h-full"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {!isResolved && (
        <div className="flex gap-3">
          {inc.status === "open" && (
            <form action={async () => { "use server"; await updateIncidentStatus(id, "in_progress"); }}>
              <SubmitButton variant="outline" pendingText="Выполнение…">→ В работу</SubmitButton>
            </form>
          )}
          {inc.status === "in_progress" && (
            <form action={async () => { "use server"; await updateIncidentStatus(id, "resolved"); }}>
              <SubmitButton className="bg-emerald-600 hover:bg-emerald-700 gap-2" pendingText="Закрытие…">✓ Закрыть</SubmitButton>
            </form>
          )}
          {inc.status === "open" && (
            <form action={async () => { "use server"; await updateIncidentStatus(id, "resolved"); }}>
              <SubmitButton variant="outline" className="text-emerald-400 border-emerald-500/30 gap-2" pendingText="Закрытие…">✓ Закрыть сразу</SubmitButton>
            </form>
          )}
        </div>
      )}
      </div>

      {/* Right Column: Chat */}
      <div className="lg:col-span-1">
        <TicketChat incidentId={id} currentUserId={currentUserId} initialMessages={messages} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null | React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}