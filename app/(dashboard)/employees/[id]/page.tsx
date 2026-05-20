import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { deleteEmployee, dismissEmployee } from "@/lib/actions/employees";
<<<<<<< HEAD
import { formatDate, extractJoinObject } from "@/lib/utils";
=======
import { formatDate } from "@/lib/utils";
>>>>>>> 72a72aed7fd900b0efcd88a2585fb0bd1f99dd9f
import { Edit, User, UserX } from "lucide-react";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [empRes, workplaceRes] = await Promise.all([
    supabase.from("employees").select("*").eq("id", id).single(),
    supabase
      .from("workplaces")
      .select("id, room, computer_id, computers(inventory_number)")
      .eq("employee_id", id)
      .maybeSingle(),
  ]);

<<<<<<< HEAD
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
=======
  if (!empRes.data) notFound();
  const emp = empRes.data;
  const workplace = workplaceRes.data;
>>>>>>> 72a72aed7fd900b0efcd88a2585fb0bd1f99dd9f

  return (
    <div className="space-y-6 max-w-2xl">
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
          <DeleteConfirmDialog
<<<<<<< HEAD
            onConfirm={async () => { "use server"; await deleteEmployee(id); }}
=======
            onConfirm={async () => { await deleteEmployee(id); }}
>>>>>>> 72a72aed7fd900b0efcd88a2585fb0bd1f99dd9f
            description="Сотрудник будет удалён из системы безвозвратно."
          />
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
              label="ПК"
<<<<<<< HEAD
              value={workplaceComputer?.inventory_number ?? null}
=======
              value={(workplace.computers as { inventory_number: string } | null)?.inventory_number}
>>>>>>> 72a72aed7fd900b0efcd88a2585fb0bd1f99dd9f
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Не назначено</p>
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
