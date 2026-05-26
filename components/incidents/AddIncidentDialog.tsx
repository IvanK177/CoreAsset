"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createIncidentDialog } from "@/lib/actions/incidents";
import { clearCache } from "@/lib/actions/revalidate";
import { useRouter } from "next/navigation";
import type { Tables } from "@/types/database.types";

type Computer = Pick<Tables<"computers">, "id" | "inventory_number">;
type Employee = Pick<Tables<"employees">, "id" | "full_name">;

const incidentDialogSchema = z.object({
  title: z.string().min(1, "Обязательное поле"),
  description: z.string().optional().or(z.literal("")),
  priority: z.enum(["low", "medium", "high", "critical"]),
  computer_id: z.string().optional().or(z.literal("")),
  employee_id: z.string().optional().or(z.literal("")),
});

type IncidentDialogValues = z.infer<typeof incidentDialogSchema>;

const PRIORITY_ITEMS: Record<string, React.ReactNode> = {
  medium: "Средний",
  low: "Низкий",
  high: "Высокий",
  critical: "Критический",
};

interface AddIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  computers: Computer[];
  employees: Employee[];
  defaultComputerId?: string;
  defaultEmployeeId?: string;
}

export function AddIncidentDialog({ open, onOpenChange, computers, employees, defaultComputerId, defaultEmployeeId }: AddIncidentDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<IncidentDialogValues>({
    resolver: zodResolver(incidentDialogSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      computer_id: defaultComputerId ?? "",
      employee_id: defaultEmployeeId ?? "",
    },
  });

  const onSubmit = async (data: IncidentDialogValues) => {
    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("title", data.title);
    formData.set("description", data.description || data.title);
    formData.set("priority", data.priority);
    formData.set("incident_type", "other");
    if (data.computer_id) formData.set("computer_id", data.computer_id);
    if (data.employee_id) formData.set("employee_id", data.employee_id);

    const result = await createIncidentDialog(formData);
    if (result.error) {
      if (result.code === "23505") {
        toast.error("Запись с таким уникальным значением уже существует");
      } else {
        toast.error("Ошибка при создании тикета: " + result.error);
      }
      setError(result.error);
      setPending(false);
      return;
    }

    await clearCache('/incidents');
    await clearCache('/dashboard');
    await clearCache('/it-portal');
    await clearCache('/it-portal/my-tasks');
    toast.success("Тикет успешно создан");
    form.reset({
      title: "",
      description: "",
      priority: "medium",
      computer_id: defaultComputerId ?? "",
      employee_id: defaultEmployeeId ?? "",
    });
    onOpenChange(false);
    startTransition(() => { router.refresh(); });
    setPending(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      onOpenChange(v);
      if (!v) form.reset({
        title: "",
        description: "",
        priority: "medium",
        computer_id: defaultComputerId ?? "",
        employee_id: defaultEmployeeId ?? "",
      });
    }}>
      <DialogContent className="sm:max-w-[580px] bg-white rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Новый тикет</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Создайте новую заявку или инцидент
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Title — full width */}
          <div className="space-y-2">
            <Label htmlFor="title">Заголовок *</Label>
            <Input
              id="title"
              placeholder="Опишите проблему кратко"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Description — full width textarea */}
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Подробное описание..."
              rows={4}
              {...form.register("description")}
            />
          </div>

          {/* Priority, Computer, Employee — 2 columns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Приоритет</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(v) => form.setValue("priority", v as "low" | "medium" | "high" | "critical")}
                items={PRIORITY_ITEMS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="low">Низкий</SelectItem>
                  <SelectItem value="high">Высокий</SelectItem>
                  <SelectItem value="critical">Критический</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Компьютер</Label>
              <Select
                value={form.watch("computer_id")}
                onValueChange={(v) => form.setValue("computer_id", v ?? "")}
                items={Object.fromEntries([
                  ["", "-- Не указан --"],
                  ...computers.map((c) => [c.id, c.inventory_number]),
                ])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- Не указан --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Не указан --</SelectItem>
                  {computers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.inventory_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Сотрудник</Label>
              <Select
                value={form.watch("employee_id")}
                onValueChange={(v) => form.setValue("employee_id", v ?? "")}
                items={Object.fromEntries([
                  ["", "-- Не указан --"],
                  ...employees.map((e) => [e.id, e.full_name]),
                ])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- Не указан --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Не указан --</SelectItem>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { onOpenChange(false); form.reset({ title: "", description: "", priority: "medium", computer_id: defaultComputerId ?? "", employee_id: defaultEmployeeId ?? "" }); }}
              disabled={pending}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
            >
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              {pending ? "Создание…" : "Создать тикет"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}