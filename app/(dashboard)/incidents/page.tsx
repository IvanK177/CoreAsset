import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import PageHeader from "@/components/layout/PageHeader";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import { Eye } from "lucide-react";

export default async function IncidentsPage() {
  const supabase = await createClient();
  const { data: incidents } = await supabase
    .from("incidents")
    .select("*, computers(inventory_number)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Инциденты"
        description="Все тикеты по оборудованию"
        action={{ label: "Создать тикет", href: "/incidents/new" }}
      />
      {!incidents?.length ? (
        <EmptyState message="Инцидентов нет" />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>ПК</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Приоритет</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((inc) => {
                const computer = inc.computers as { inventory_number: string } | null;
                return (
                  <TableRow key={inc.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-sm">{computer?.inventory_number ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground capitalize">{inc.incident_type}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{inc.description}</TableCell>
                    <TableCell><PriorityBadge priority={inc.priority} /></TableCell>
                    <TableCell><IncidentStatusBadge status={inc.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(inc.created_at)}</TableCell>
                    <TableCell>
                      <Link href={`/incidents/${inc.id}`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
