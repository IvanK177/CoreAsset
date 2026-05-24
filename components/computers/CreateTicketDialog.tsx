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
import { createIncidentFromComputer } from "@/lib/actions/incidents";
import { clearCache } from "@/lib/actions/revalidate";
import { useRouter } from "next/navigation";
import type { Tables } from "@/types/database.types";

type ActiveEmployee = Pick<Tables<"employees">, "id" | "full_name">;

const createTicketSchema = z.object({
  title: z.string().min(1, "Обязательное поле"),
  description: z.string().optional().or(z.literal("")),
  priority: z.enum(["low", "medium", "high", "critical"]),
});

type CreateTicketValues = z.infer<typeof createTicketSchema>;

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  computerId: string;
  employeeId: string | null;
  activeEmployees: ActiveEmployee[];
}

export function CreateTicketDialog({
  open,
  onOpenChange,
  computerId,
  employeeId,
  activeEmployees,
}: CreateTicketDialogProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employeeId ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<CreateTicketValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
    },
  });

  const onSubmit = async (data: CreateTicketValues) => {
    setPending(true);
    setError(null);

    const result = await createIncidentFromComputer(
      computerId,
      selectedEmployeeId || null,
      data.title,
      data.description || undefined,
      data.priority,
    );
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
    await clearCache('/computers');
    await clearCache('/dashboard');
    toast.success("Тикет успешно создан");
    form.reset({ title: "", description: "", priority: "medium" });
    onOpenChange(false);
    startTransition(() => { router.refresh(); });
    setPending(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSelectedEmployeeId(employeeId ?? ""); }}>
      <DialogContent className="sm:max-w-[580px] bg-white rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Создать тикет</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Создайте новый инцидент для этого компьютера
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Подробное описание..."
              rows={4}
              {...form.register("description")}
            />
          </div>

          {/* Employee & Priority — 2 columns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Сотрудник</Label>
              <Select
                value={selectedEmployeeId}
                onValueChange={(v) => setSelectedEmployeeId(v ?? "")}
                items={Object.fromEntries([
                  ["", "— Не указан —"],
                  ...activeEmployees.map((e) => [e.id, e.full_name]),
                ])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="— Не указан —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Не указан —</SelectItem>
                  {activeEmployees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Приоритет</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(v) => form.setValue("priority", v as "low" | "medium" | "high" | "critical")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Низкий</SelectItem>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="high">Высокий</SelectItem>
                  <SelectItem value="critical">Критический</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { onOpenChange(false); form.reset({ title: "", description: "", priority: "medium" }); }}
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
              {pending ? "Создание…" : "Создать"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}