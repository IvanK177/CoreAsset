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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEmployeeDialog } from "@/lib/actions/employees";
import { clearCache } from "@/lib/actions/revalidate";
import { useRouter } from "next/navigation";
import { Key } from "lucide-react";

const ROLE_ITEMS: Record<string, React.ReactNode> = {
  employee: "Сотрудник",
  admin: "Администратор",
  it_specialist: "IT-специалист",
};

const employeeDialogSchema = z.object({
  full_name: z.string().min(1, "Обязательное поле"),
  position: z.string().min(1, "Обязательное поле"),
  room: z.string().optional().or(z.literal("")),
  email: z.string().email("Некорректный email"),
  phone: z.string().optional().or(z.literal("")),
  telegram: z.string().optional().or(z.literal("")),
  role: z.enum(["admin", "employee", "it_specialist"]),
});

type EmployeeDialogValues = z.infer<typeof employeeDialogSchema>;

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddEmployeeDialog({ open, onOpenChange }: AddEmployeeDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<EmployeeDialogValues>({
    resolver: zodResolver(employeeDialogSchema),
    defaultValues: {
      full_name: "",
      position: "",
      room: "",
      email: "",
      phone: "",
      telegram: "",
      role: "employee",
    },
  });

  const onSubmit = async (data: EmployeeDialogValues) => {
    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("full_name", data.full_name);
    formData.set("position", data.position);
    if (data.room) formData.set("room", data.room);
    if (data.email) formData.set("email", data.email);
    if (data.phone) formData.set("phone", data.phone);
    if (data.telegram) formData.set("telegram", data.telegram);
    formData.set("role", data.role);

    const result = await createEmployeeDialog(formData);
    if (result.error) {
      if (result.code === "23505") {
        toast.error("Сотрудник с таким email уже существует");
        form.setError("email", { message: "Этот email уже зарегистрирован в системе" });
      } else {
        toast.error("Ошибка при сохранении: " + result.error);
        setError(result.error);
      }
      setPending(false);
      return;
    }

    await clearCache('/employees');
    await clearCache('/dashboard');
    toast.success("Сотрудник успешно добавлен");
    form.reset();
    onOpenChange(false);
    startTransition(() => { router.refresh(); });
    setPending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] bg-white rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Добавить сотрудника</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Заполните данные для создания нового аккаунта
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Full name — full width */}
          <div className="space-y-2">
            <Label htmlFor="full_name">ФИО *</Label>
            <Input
              id="full_name"
              placeholder="Иванов Иван Иванович"
              {...form.register("full_name")}
            />
            {form.formState.errors.full_name && (
              <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
            )}
          </div>

          {/* Other fields — 2 columns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Должность *</Label>
              <Input
                id="position"
                placeholder="Разработчик"
                {...form.register("position")}
              />
              {form.formState.errors.position && (
                <p className="text-xs text-destructive">{form.formState.errors.position.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="room">Кабинет</Label>
              <Input
                id="room"
                placeholder="204"
                {...form.register("room")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email / Логин</Label>
              <Input
                id="email"
                placeholder="ivanov@corp.ru"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select
                value={form.watch("role")}
                onValueChange={(v) => form.setValue("role", v as "admin" | "employee" | "it_specialist")}
                items={ROLE_ITEMS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Сотрудник</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                  <SelectItem value="it_specialist">IT-специалист</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                placeholder="+7-900-000-0000"
                {...form.register("phone")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram</Label>
              <Input
                id="telegram"
                placeholder="@username"
                {...form.register("telegram")}
              />
            </div>
          </div>

          {/* Info block */}
          <div className="w-full rounded-lg bg-blue-50 px-4 py-3 flex items-start gap-3">
            <Key className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-600">
              После создания система автоматически сгенерирует надёжный пароль и покажет его вам.
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { onOpenChange(false); form.reset(); }}
              disabled={pending}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {pending ? "Создание…" : "Создать аккаунт"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}