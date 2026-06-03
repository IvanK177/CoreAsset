import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { EmployeeStatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Tables } from "@/types/database.types";
import { Eye } from "lucide-react";

type Employee = Tables<"employees">;

export default function EmployeeTable({ employees }: { employees: Employee[] }) {
  if (employees.length === 0) return <EmptyState message="Сотрудники не найдены" />;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead>ФИО</TableHead>
            <TableHead>Должность / Отдел</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Кабинет</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((e) => (
            <TableRow key={e.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-medium">{e.full_name}</TableCell>
              <TableCell className="text-muted-foreground">{e.position ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{e.email ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{e.room ?? "—"}</TableCell>
              <TableCell>
                <EmployeeStatusBadge status={e.is_active ? "active" : "dismissed"} />
              </TableCell>
              <TableCell>
                <Link href={`/employees/${e.id}`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
                  <Eye className="w-4 h-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
