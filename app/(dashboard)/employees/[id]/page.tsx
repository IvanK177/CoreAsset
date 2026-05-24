export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { ComputerStatusBadge } from "@/components/shared/StatusBadge";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { deleteEmployee, dismissEmployee, restoreEmployee } from "@/lib/actions/employees";
import { formatDate, extractJoinObject } from "@/lib/utils";
import { Edit, Monitor, User, UserCheck, UserX } from "lucide-react";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [empRes, workplaceRes, computersRes, incidentsRes] = await Promise.all([
    supabase.from("employees").select("*").eq("id", id).single(),
    supabase
      .from("workplaces")
      .select("id, room, computer_id, computers(inventory_number)")
      .eq("employee_id", id)
      .maybeSingle(),
    supabase
      .from("computers")
      .select("id, inventory_number, computer_type, lifecycle_status")
      .eq("employee_id", id),
    supabase
      .from("incidents")
      .select("id, title, description, priority, status, incident_type, created_at, computer_id, computers(id, inventory_number)")
      .eq("employee_id", id)
      .order("created_at", { ascending: false }),
  ]);

  // Check for Supabase errors on the main entity
  if (empRes.error) {
    console.error("[EmployeeDetail] Supabase query error:", empRes.error.code, empRes.error.message);
    // PGRST116 = ".single()" found 0 rows → genuine not-found
    if (empRes.error.code === "PGRST116") notFound();
    // Any other error (RLS, network, etc.) → throw to trigger Error Boundary
    throw new Error(`Failed to fetch employee: ${empRes.error.message}`);
  }

  if (!empRes.data) notFound();
  const emp = empRes.data;

  // Workplace is optional — log errors but don't crash
  if (workplaceRes.error) {
    console.error("[EmployeeDetail] Workplace query error:", workplaceRes.error.code, workplaceRes.error.message);
  }
  const workplace = workplaceRes.data;
  // Supabase may return computers join as array or object — normalize with extractJoinObject
  const workplaceComputer = extractJoinObject(
    workplace?.computers as unknown
  ) as { inventory_number: string } | null;

  // Computers directly assigned to this employee
  if (computersRes.error) {
    console.error("[EmployeeDetail] Computers query error:", computersRes.error.code, computersRes.error.message);
  }
  const assignedComputers = computersRes.data ?? [];

  // Incidents created by this employee
  if (incidentsRes.error) {
    console.error("[EmployeeDetail] Incidents query error:", incidentsRes.error.code, incidentsRes.error.message);
  }
  const employeeIncidents = (incidentsRes.data ?? []).map((inc) => ({
    ...inc,
    computer: extractJoinObject(inc.computers as unknown) as { id: string; inventory_number: string } | null,
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
            <p className="text-sm text-muted-foreground">{emp.position ?? "—"} · {emp.department ?? "—"}</p>
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
              <Button variant="outline" size="sm" type="submit" className="gap-2 text-amber-400 border-amber-500/30 hover:bg-amber-500/10">
                <UserX className="w-4 h-4" /> Уволить
              </Button>
            </form>
          )}
          {!emp.is_active && (
            <>
              <form action={async () => { "use server"; await restoreEmployee(id); }}>
                <Button variant="outline" size="sm" type="submit" className="gap-2 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10">
                  <UserCheck className="w-4 h-4" /> Вернуть
                </Button>
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
        <Row label="Табельный №" value={emp.employee_number} />
        <Row label="Добавлен" value={formatDate(emp.created_at)} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Рабочее место</p>
        {workplace ? (
          <>
            <Row label="Кабинет" value={workplace.room} />
            <Row
              label="ПК (рабочее место)"
              value={workplaceComputer?.inventory_number ?? null}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Не назначено</p>
        )}
      </div>

      {/* Assigned computers section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Закреплённые компьютеры ({assignedComputers.length})
          </p>
        </div>
        <Separator />
        {assignedComputers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет закреплённых компьютеров</p>
        ) : (
          <div className="space-y-2">
            {assignedComputers.map((comp) => (
              <Link key={comp.id} href={`/computers/${comp.id}`} className="flex items-center justify-between hover:bg-muted/30 rounded-lg p-2 transition-colors">
                <div className="flex items-center gap-3">
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium font-mono">{comp.inventory_number}</p>
                    <p className="text-xs text-muted-foreground">{comp.computer_type}</p>
                  </div>
                </div>
                <ComputerStatusBadge status={comp.lifecycle_status} />
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
          <Link href={`/incidents/new`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            + Создать тикет
          </Link>
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
                    {inc.computer && ` · ${inc.computer.inventory_number}`}
                  </p>
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
