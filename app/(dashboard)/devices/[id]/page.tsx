export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { TicketDialogButton } from "@/components/shared/TicketDialogButton";
import { ComputerStatusBadge as DeviceStatusBadge } from "@/components/shared/StatusBadge";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { deleteDevice } from "@/lib/actions/devices";
import { formatDate, extractJoinObject, safeHardware, formatDateTimeRu } from "@/lib/utils";
import { Edit, Monitor, Cpu, Keyboard, Mouse, Printer, HelpCircle, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";

const DEVICE_TYPE_LABELS: Record<string, string> = {
  pc: "Компьютер / Ноутбук",
  monitor: "Монитор",
  keyboard: "Клавиатура",
  mouse: "Мышь",
  printer: "Оргтехника (Принтер)",
  other: "Другое",
};

function getDeviceIcon(type: string) {
  switch (type) {
    case "pc": return <Cpu className="w-5 h-5 text-primary" />;
    case "monitor": return <Monitor className="w-5 h-5 text-primary" />;
    case "keyboard": return <Keyboard className="w-5 h-5 text-primary" />;
    case "mouse": return <Mouse className="w-5 h-5 text-primary" />;
    case "printer": return <Printer className="w-5 h-5 text-primary" />;
    default: return <HelpCircle className="w-5 h-5 text-primary" />;
  }
}

export default async function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [deviceRes, incidentsRes, installsRes, allDevicesRes, allEmployeesRes] = await Promise.all([
    supabase.from("devices").select("*, employees(id, full_name, position, email, room)").eq("id", id).single(),
    supabase
      .from("incidents")
      .select("id, incident_type, description, priority, status, created_at")
      .eq("device_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("device_licenses")
      .select("id, installed_at, licenses(id, software_name, version)")
      .eq("device_id", id),
    supabase.from("devices").select("id, inventory_number").order("inventory_number"),
    supabase.from("employees").select("id, full_name, room").eq("is_active", true).order("full_name"),
  ]);

  // Check for Supabase errors on the main entity
  if (deviceRes.error) {
    console.error("[DeviceDetail] Supabase query error:", deviceRes.error.code, deviceRes.error.message);
    if (deviceRes.error.code === "PGRST116") notFound();
    throw new Error(`Failed to fetch device: ${deviceRes.error.message}`);
  }

  if (!deviceRes.data) notFound();
  const device = deviceRes.data;

  // Extract joined employee — Supabase may return as array or object
  const employee = extractJoinObject(device.employees as unknown) as { id: string; full_name: string; position: string | null; email: string | null; room: string | null } | null;

  // Safely parse hardware JSON
  const hw = safeHardware(device.hardware) as Record<string, string>;

  // Incidents are supplementary — log errors but don't crash
  if (incidentsRes.error) {
    console.error("[DeviceDetail] Incidents query error:", incidentsRes.error.code, incidentsRes.error.message);
  }
  const incidents = incidentsRes.data ?? [];

  // Software installations are supplementary
  if (installsRes.error) {
    console.error("[DeviceDetail] Installations query error:", installsRes.error.code, installsRes.error.message);
  }
  const rawInstalls = installsRes.data ?? [];
  // Normalize license join
  const installs = rawInstalls.map((inst) => ({
    id: inst.id,
    installed_at: inst.installed_at,
    licenses: extractJoinObject(inst.licenses as unknown) as { id: string; software_name: string; version: string | null } | null,
  }));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            {getDeviceIcon(device.device_type)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{device.inventory_number}</h1>
            <p className="text-sm text-muted-foreground">
              {DEVICE_TYPE_LABELS[device.device_type]} {device.computer_type ? `(${device.computer_type})` : ""}
            </p>
          </div>
          <DeviceStatusBadge status={device.lifecycle_status as any} />
        </div>
        <div className="flex gap-2">
          <Link href={`/devices/${id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" }) + " gap-2"}>
            <Edit className="w-4 h-4" /> Изменить
          </Link>
          <DeleteConfirmDialog
            onConfirm={async () => { "use server"; await deleteDevice(id); }}
            description="Будут удалены все связанные тикеты инцидентов и установки ПО."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3 bg-white shadow-sm">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Основная информация</p>
          <Row label="Серийный номер" value={device.serial_number} />
          <Row label="Кабинет" value={device.room} />
          <Row label="Добавлен" value={formatDate(device.created_at)} />
        </div>

        {device.device_type === "pc" && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-3 bg-white shadow-sm">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Характеристики ПК</p>
            <Row label="CPU" value={hw.cpu} />
            <Row label="RAM" value={hw.ram} />
            <Row label="Диск" value={hw.storage} />
            <Row label="GPU" value={hw.gpu} />
            <Row label="MAC-адрес" value={hw.mac_address} />
          </div>
        )}

        {device.device_type === "monitor" && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-3 bg-white shadow-sm">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Характеристики Монитора</p>
            <Row label="Диагональ" value={hw.diagonal} />
            <Row label="Разрешение" value={hw.resolution} />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3 bg-white shadow-sm">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Закреплённый сотрудник</p>
        {employee ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-bold">
              {employee.full_name.charAt(0)}
            </div>
            <div>
              <Link href={`/employees/${employee.id}`} className="text-sm font-medium hover:underline">
                {employee.full_name}
              </Link>
              <p className="text-xs text-muted-foreground">
                {employee.position ?? "—"} · Каб. {employee.room ?? "—"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Не закреплён</p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Установленное ПО ({installs.length})
          </p>
        </div>
        {installs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет установленного ПО</p>
        ) : (
          <div className="space-y-2">
            {installs.map((inst) => {
              const lic = inst.licenses;
              return (
                <div key={inst.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-sm">{lic?.software_name ?? "—"} {lic?.version ? `v${lic.version}` : ""}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(inst.installed_at)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            История инцидентов ({incidents.length})
          </p>
          <TicketDialogButton
            devices={allDevicesRes.data ?? []}
            employees={allEmployeesRes.data ?? []}
            defaultDeviceId={id}
            defaultEmployeeId={device.employee_id ?? undefined}
          />
        </div>
        <Separator />
        {incidents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет инцидентов</p>
        ) : (
          <div className="space-y-3">
            {incidents.map((inc) => (
              <Link key={inc.id} href={`/incidents?selectedId=${inc.id}`} className="flex items-start gap-3 hover:bg-muted/30 rounded-lg p-2 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{inc.description}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTimeRu(inc.created_at)} · {inc.incident_type}</p>
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
