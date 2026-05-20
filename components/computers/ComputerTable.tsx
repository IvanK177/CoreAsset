import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { ComputerStatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Tables } from "@/types/database.types";
import { Eye } from "lucide-react";

type Computer = Tables<"computers">;

export default function ComputerTable({ computers }: { computers: Computer[] }) {
  if (computers.length === 0) return <EmptyState message="Компьютеры не найдены" />;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead>Инвентарный №</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead>Кабинет</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {computers.map((c) => (
            <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-mono font-medium">{c.inventory_number}</TableCell>
              <TableCell className="text-muted-foreground">{c.computer_type}</TableCell>
              <TableCell className="text-muted-foreground">{c.room ?? "—"}</TableCell>
              <TableCell>
                <ComputerStatusBadge status={c.lifecycle_status} />
              </TableCell>
              <TableCell>
                <Link href={`/computers/${c.id}`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
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
