import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { ComputerStatusBadge as DeviceStatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Tables } from "@/types/database.types";
import { Eye } from "lucide-react";

type Device = Tables<"devices">;

const DEVICE_TYPE_LABELS: Record<string, string> = {
  pc: "Компьютер / Ноутбук",
  monitor: "Монитор",
  keyboard: "Клавиатура",
  mouse: "Мышь",
  printer: "Оргтехника (Принтер)",
  other: "Другое",
};

export default function DeviceTable({ devices }: { devices: Device[] }) {
  if (devices.length === 0) return <EmptyState message="Устройства не найдены" />;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead>Инвентарный №</TableHead>
            <TableHead>Тип устройства</TableHead>
            <TableHead>Название / Модель</TableHead>
            <TableHead>Кабинет</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((d) => (
            <TableRow key={d.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-mono font-medium">{d.inventory_number}</TableCell>
              <TableCell className="text-muted-foreground">{DEVICE_TYPE_LABELS[d.device_type] || d.device_type}</TableCell>
              <TableCell className="font-medium">{d.computer_type}</TableCell>
              <TableCell className="text-muted-foreground">{d.room ?? "—"}</TableCell>
              <TableCell>
                <DeviceStatusBadge status={d.lifecycle_status as any} />
              </TableCell>
              <TableCell>
                <Link href={`/devices/${d.id}`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
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
