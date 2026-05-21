import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { ComputerStatusBadge } from "@/components/shared/StatusBadge";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { deleteComputer } from "@/lib/actions/computers";
import { formatDate, extractJoinObject, safeHardware } from "@/lib/utils";
import { Edit, Monitor } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";

export default async function ComputerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [computerRes, incidentsRes, installsRes] = await Promise.all([
    supabase.from("computers").select("*").eq("id", id).single(),
    supabase
      .from("incidents")
      .select("id, incident_type, description, priority, status, created_at")
      .eq("computer_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("software_installations")
      .select("id, installed_at, software(id, name, version)")
      .eq("computer_id", id),
  ]);

  // Check for Supabase errors on the main entity
  if (computerRes.error) {
    console.error("[ComputerDetail] Supabase query error:", computerRes.error.code, computerRes.error.message);
    if (computerRes.error.code === "PGRST116") notFound();
    throw new Error(`Failed to fetch computer: ${computerRes.error.message}`);
  }

  if (!computerRes.data) notFound();
  const computer = computerRes.data;

  // Safely parse hardware JSON — validates types and ignores unknown fields (e.g. gpu)
  const hw = safeHardware(computer.hardware);

  // Incidents are supplementary — log errors but don't crash
  if (incidentsRes.error) {
    console.error("[ComputerDetail] Incidents query error:", incidentsRes.error.code, incidentsRes.error.message);
  }
  const incidents = incidentsRes.data ?? [];

  // Software installations are supplementary — log errors but don't crash
  if (installsRes.error) {
    console.error("[ComputerDetail] Installations query error:", installsRes.error.code, installsRes.error.message);
  }
  const rawInstalls = installsRes.data ?? [];
  // Normalize software join — Supabase may return as array or object depending on relationship
  const installs = rawInstalls.map((inst) => ({
    id: inst.id,
    installed_at: inst.installed_at,
    software: extractJoinObject(inst.software as unknown) as { id: string; name: string; version: string | null } | null,
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
              const sw = inst.software;
              return (
                <div key={inst.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-sm">{sw?.name ?? "—"} {sw?.version ? `v${sw.version}` : ""}</span>
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
          <Link href={`/incidents/new?computer_id=${id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            + Создать тикет
          </Link>
        </div>
        <Separator />
        {incidents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет инцидентов</p>
        ) : (
          <div className="space-y-3">
            {incidents.map((inc) => (
              <Link key={inc.id} href={`/incidents/${inc.id}`} className="flex items-start gap-3 hover:bg-muted/30 rounded-lg p-2 transition-colors">
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
