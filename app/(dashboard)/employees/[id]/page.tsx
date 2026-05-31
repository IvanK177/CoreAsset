export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { TicketDialogButton } from "@/components/shared/TicketDialogButton";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { ComputerStatusBadge } from "@/components/shared/StatusBadge";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { deleteEmployee, dismissEmployee, restoreEmployee } from "@/lib/actions/employees";
import { formatDate, extractJoinObject } from "@/lib/utils";
import { Edit, Monitor, User, UserCheck, UserX, Phone, MessageCircle } from "lucide-react";

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

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [empRes, devicesRes, incidentsRes, allDevicesRes, allEmployeesRes] = await Promise.all([
    supabase.from("employees").select("*").eq("id", id).single(),
    supabase
      .from("devices")
      .select("id, inventory_number, computer_type, device_type, lifecycle_status, room")
      .eq("employee_id", id),
    supabase
      .from("incidents")
      .select("id, title, description, priority, status, incident_type, created_at, device_id, devices!incidents_device_id_fkey(id, inventory_number, device_type, computer_type)")
      .eq("employee_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("devices").select("id, inventory_number, device_type, computer_type").order("inventory_number"),
    supabase.from("employees").select("id, full_name, room").eq("is_active", true).order("full_name"),
  ]);

  // Check for Supabase errors on the main entity
  if (empRes.error) {
    console.error("[EmployeeDetail] Supabase query error:", empRes.error.code, empRes.error.message);
    if (empRes.error.code === "PGRST116") notFound();
    throw new Error(`Failed to fetch employee: ${empRes.error.message}`);
  }

  if (!empRes.data) notFound();
  const emp = empRes.data;

  // Devices directly assigned to this employee
  if (devicesRes.error) {
    console.error("[EmployeeDetail] Devices query error:", devicesRes.error.code, devicesRes.error.message);
  }
  const assignedDevices = devicesRes.data ?? [];

  // Incidents created by this employee
  if (incidentsRes.error) {
    console.error("[EmployeeDetail] Incidents query error:", incidentsRes.error.code, incidentsRes.error.message);
  }
  const employeeIncidents = (incidentsRes.data ?? []).map((inc) => ({
    ...inc,
    device: extractJoinObject(inc.devices as unknown) as { id: string; inventory_number: string; device_type: string; computer_type: string | null } | null,
  }));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{emp.full_name}</h1>
            <p className="text-sm text-muted-foreground">{emp.position ?? "—"} · Каб. {emp.room ?? "—"}</p>
          </div>
          <Badge
            variant="outline"
            className={emp.is_active
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : "bg-slate-500/15 text-slate-400 border-slate-500/30"}
          >
            {emp.is_active ? "Активен" : "Уволен"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Link href={`/employees/${id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" }) + " gap-2"}>
            <Edit className="w-4 h-4" /> Изменить
          </Link>
          {emp.is_active && (
            <form action={async () => { "use server"; await dismissEmployee(id); }}>
              <SubmitButton variant="outline" size="sm" className="gap-2 text-amber-400 border-amber-500/30 hover:bg-amber-500/10" pendingText="Увольнение…">
                <UserX className="w-4 h-4" /> Уволить
              </SubmitButton>
            </form>
          )}
          {!emp.is_active && (
            <>
              <form action={async () => { "use server"; await restoreEmployee(id); }}>
                <SubmitButton variant="outline" size="sm" className="gap-2 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10" pendingText="Восстановление…">
                  <UserCheck className="w-4 h-4" /> Вернуть
                </SubmitButton>
              </form>
              <DeleteConfirmDialog
                onConfirm={async () => { "use server"; await deleteEmployee(id); }}
                description="Сотрудник будет удалён из системы безвозвратно."
              />
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Данные</p>
        <Row label="Email" value={emp.email} />
        <Row label="Телефон" value={emp.phone} />
        <Row label="Telegram" value={emp.telegram} />
        <Row label="Кабинет" value={emp.room} />
        <Row label="Роль" value={emp.role} />
        <Row label="Добавлен" value={formatDate(emp.created_at)} />
      </div>

      {/* Assigned devices section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Закреплённые устройства ({assignedDevices.length})
          </p>
        </div>
        <Separator />
        {assignedDevices.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет закреплённых устройств</p>
        ) : (
          <div className="space-y-2">
            {assignedDevices.map((dev) => (
              <Link key={dev.id} href={`/devices/${dev.id}`} className="flex items-center justify-between hover:bg-muted/30 rounded-lg p-2 transition-colors">
                <div className="flex items-center gap-3">
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium font-mono">
                      {deviceTypeEmojis[dev.device_type] || "🔌"} {dev.inventory_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {deviceTypeRussianLabels[dev.device_type] || "Устройство"}{dev.computer_type ? ` (${dev.computer_type})` : ""}
                    </p>
                  </div>
                </div>
                <ComputerStatusBadge status={dev.lifecycle_status as any} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Incidents section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Инциденты ({employeeIncidents.length})
          </p>
          <TicketDialogButton
            devices={allDevicesRes.data ?? []}
            employees={allEmployeesRes.data ?? []}
            defaultEmployeeId={id}
          />
        </div>
        <Separator />
        {employeeIncidents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет инцидентов</p>
        ) : (
          <div className="space-y-3">
            {employeeIncidents.map((inc) => (
              <Link key={inc.id} href={`/incidents?selectedId=${inc.id}`} className="flex items-start gap-3 hover:bg-muted/30 rounded-lg p-2 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{inc.title || inc.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(inc.created_at)} · {inc.incident_type}
                    {inc.device && ` · ${deviceTypeEmojis[inc.device.device_type] || "🔌"} ${inc.device.inventory_number}`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <PriorityBadge priority={inc.priority as any} />
                  <IncidentStatusBadge status={inc.status as any} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}
