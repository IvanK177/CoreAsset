export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { unstable_noStore as noStore } from 'next/cache';
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import PageHeader from "@/components/layout/PageHeader";
import { Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function WorkplacesPage() {
  noStore();
  const supabase = createServiceClient();
  const { data: workplaces } = await supabase
    .from("workplaces")
    .select("*, computers(inventory_number), employees(full_name)")
    .order("room");

  return (
    <div>
      <PageHeader
        title="Рабочие места"
        description="Привязка компьютеров и сотрудников к кабинетам"
        action={{ label: "Создать", href: "/workplaces/new" }}
      />
      {!workplaces?.length ? (
        <EmptyState message="Рабочих мест нет" />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Кабинет</TableHead>
                <TableHead>Компьютер</TableHead>
                <TableHead>Сотрудник</TableHead>
                <TableHead>Назначен</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {workplaces.map((w) => (
                <TableRow key={w.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{w.room}</TableCell>
                  <TableCell className="text-muted-foreground font-mono">
                    {(w.computers as { inventory_number: string } | null)?.inventory_number ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {(w.employees as { full_name: string } | null)?.full_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(w.assigned_at)}</TableCell>
                  <TableCell>
                    <Link href={`/workplaces/${w.id}`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
                      <Eye className="w-4 h-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
