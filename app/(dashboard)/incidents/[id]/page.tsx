import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";
import { deleteIncident, updateIncidentStatus } from "@/lib/actions/incidents";
import { formatDate } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: inc } = await supabase
    .from("incidents")
    .select("*, computers(id, inventory_number)")
    .eq("id", id)
    .single();

  if (!inc) notFound();

  const computer = inc.computers as { id: string; inventory_number: string } | null;
  const isResolved = inc.status === "resolved";

  return (
    <div className="space-y-6 max-w-2xl">
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
            <PriorityBadge priority={inc.priority} />
            <IncidentStatusBadge status={inc.status} />
          </div>
        </div>
        <DeleteConfirmDialog
          onConfirm={async () => { "use server"; await deleteIncident(id); }}
          description="Тикет будет удалён безвозвратно."
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Детали</p>
        <Row label="Компьютер" value={
          computer ? (
            <Link href={`/computers/${computer.id}`} className="text-primary hover:underline font-mono">
              {computer.inventory_number}
            </Link>
          ) : "—"
        } />
        <Row label="Создан" value={formatDate(inc.created_at)} />
        {inc.resolved_at && <Row label="Закрыт" value={formatDate(inc.resolved_at)} />}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Описание</p>
        <p className="text-sm whitespace-pre-wrap">{inc.description}</p>
      </div>

      {!isResolved && (
        <div className="flex gap-3">
          {inc.status === "open" && (
            <form action={async () => { "use server"; await updateIncidentStatus(id, "in_progress"); }}>
              <Button variant="outline" type="submit">→ В работу</Button>
            </form>
          )}
          {inc.status === "in_progress" && (
            <form action={async () => { "use server"; await updateIncidentStatus(id, "resolved"); }}>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">✓ Закрыть</Button>
            </form>
          )}
          {inc.status === "open" && (
            <form action={async () => { "use server"; await updateIncidentStatus(id, "resolved"); }}>
              <Button variant="outline" type="submit" className="text-emerald-400 border-emerald-500/30">✓ Закрыть сразу</Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
