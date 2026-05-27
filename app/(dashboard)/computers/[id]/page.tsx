export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { TicketDialogButton } from "@/components/shared/TicketDialogButton";
import { ComputerStatusBadge } from "@/components/shared/StatusBadge";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { deleteComputer } from "@/lib/actions/computers";
import { formatDate, extractJoinObject, safeHardware } from "@/lib/utils";
import { Edit, Monitor, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";

export default async function ComputerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [computerRes, incidentsRes, installsRes, allComputersRes, allEmployeesRes] = await Promise.all([
    supabase.from("computers").select("*, employees(id, full_name, position, email, room)").eq("id", id).single(),
    supabase
      .from("incidents")
      .select("id, incident_type, description, priority, status, created_at")
      .eq("computer_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("computer_licenses")
      .select("id, installed_at, licenses(id, software_name, version)")
      .eq("computer_id", id),
    supabase.from("computers").select("id, inventory_number").order("inventory_number"),
    supabase.from("employees").select("id, full_name, room").eq("is_active", true).order("full_name"),
  ]);

  // Check for Supabase errors on the main entity
  if (computerRes.error) {
    console.error("[ComputerDetail] Supabase query error:", computerRes.error.code, computerRes.error.message);
    if (computerRes.error.code === "PGRST116") notFound();
    throw new Error(`Failed to fetch computer: ${computerRes.error.message}`);
  }

  if (!computerRes.data) notFound();
  const computer = computerRes.data;

  // Extract joined employee — Supabase may return as array or object
  const employee = extractJoinObject(computer.employees as unknown) as { id: string; full_name: string; position: string | null; email: string | null; room: string | null } | null;

  // Safely parse hardware JSON
  const hw = safeHardware(computer.hardware);

  // Incidents are supplementary — log errors but don't crash
  if (incidentsRes.error) {
    console.error("[ComputerDetail] Incidents query error:", incidentsRes.error.code, incidentsRes.error.message);
  }
  const incidents = incidentsRes.data ?? [];

  // Software installations are supplementary
  if (installsRes.error) {
    console.error("[ComputerDetail] Installations query error:", installsRes.error.code, installsRes.error.message);
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
            <Monitor className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{computer.inventory_number}</h1>
            <p className="text-sm text-muted-foreground">{computer.computer_type}</p>
          </div>
          <ComputerStatusBadge status={computer.lifecycle_status} />
        </div>
        <div className="flex gap-2">
          <Link href={`/computers/${id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" }) + " gap-2"}>
            <Edit className="w-4 h-4" /> Изменить
          </Link>
            <DeleteConfirmDialog
              onConfirm={async () => { "use server"; await deleteComputer(id); }}
              description="Будут удалены все связанные тикеты инцидентов."
            />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Основная информация</p>
          <Row label="Серийный номер" value={computer.serial_number} />
          <Row label="Кабинет" value={computer.room} />
          <Row label="Добавлен" value={formatDate(computer.created_at)} />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Характеристики</p>
          <Row label="CPU" value={hw.cpu} />
          <Row label="RAM" value={hw.ram} />
          <Row label="Диск" value={hw.storage} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
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

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
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

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            История инцидентов ({incidents.length})
          </p>
          <TicketDialogButton
            computers={allComputersRes.data ?? []}
            employees={allEmployeesRes.data ?? []}
            defaultComputerId={id}
            defaultEmployeeId={computer.employee_id ?? undefined}
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
                  <p className="text-xs text-muted-foreground">{formatDate(inc.created_at)} · {inc.incident_type}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <PriorityBadge priority={inc.priority} />
                  <IncidentStatusBadge status={inc.status} />
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
