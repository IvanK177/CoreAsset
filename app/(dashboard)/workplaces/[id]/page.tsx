export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { deleteWorkplace } from "@/lib/actions/workplaces";
import { formatDate } from "@/lib/utils";
import { Edit, MapPin } from "lucide-react";

export default async function WorkplaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: w } = await supabase
    .from("workplaces")
    .select("*, computers(id, inventory_number, lifecycle_status), employees(id, full_name, position)")
    .eq("id", id)
    .single();

  if (!w) notFound();

  const computer = w.computers as { id: string; inventory_number: string } | null;
  const employee = w.employees as { id: string; full_name: string; position: string | null } | null;

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Кабинет {w.room}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/workplaces/${id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" }) + " gap-2"}>
            <Edit className="w-4 h-4" /> Изменить
          </Link>
          <DeleteConfirmDialog
            onConfirm={async () => { "use server"; await deleteWorkplace(id); }}
            description="Рабочее место будет удалено."
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Информация</p>
        <Row label="Кабинет" value={w.room} />
        <Row label="Создан" value={formatDate(w.created_at)} />
        <Row label="Назначен" value={formatDate(w.assigned_at)} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Компьютер</p>
        {computer ? (
          <Link href={`/computers/${computer.id}`} className="text-primary hover:underline font-mono">
            {computer.inventory_number}
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">Не назначен</p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Сотрудник</p>
        {employee ? (
          <Link href={`/employees/${employee.id}`} className="text-primary hover:underline">
            {employee.full_name}
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">Не назначен</p>
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
