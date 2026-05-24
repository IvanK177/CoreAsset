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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { linkEmployeeToComputer } from "@/lib/actions/computers";
import { clearCache } from "@/lib/actions/revalidate";
import { useRouter } from "next/navigation";

const linkEmployeeSchema = z.object({
  employee_id: z.string().nullable(),
});

type LinkEmployeeValues = z.infer<typeof linkEmployeeSchema>;

interface ActiveEmployee {
  id: string;
  full_name: string;
  position: string | null;
}

interface LinkEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  computerId: string;
  currentEmployeeId: string | null;
  activeEmployees: ActiveEmployee[];
}

export function LinkEmployeeDialog({
  open,
  onOpenChange,
  computerId,
  currentEmployeeId,
  activeEmployees,
}: LinkEmployeeDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<LinkEmployeeValues>({
    resolver: zodResolver(linkEmployeeSchema),
    defaultValues: {
      employee_id: currentEmployeeId ?? "",
    },
  });

  const onSubmit = async (data: LinkEmployeeValues) => {
    setPending(true);
    setError(null);

    const employeeId = data.employee_id === "" ? null : data.employee_id;
    const result = await linkEmployeeToComputer(computerId, employeeId);
    if (result.error) {
      toast.error("Ошибка при привязке сотрудника: " + result.error);
      setError(result.error);
      setPending(false);
      return;
    }

    await clearCache('/computers');
    await clearCache(`/computers/${computerId}`);
    await clearCache('/employees');
    await clearCache('/dashboard');
    toast.success("Сотрудник успешно привязан к компьютеру");
    form.reset();
    onOpenChange(false);
    startTransition(() => { router.refresh(); });
    setPending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Привязать к сотруднику</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Выберите активного сотрудника для закрепления компьютера
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Сотрудник</Label>
            <Select
              value={form.watch("employee_id") ?? ""}
              onValueChange={(v) => form.setValue("employee_id", v === "__none__" ? "" : v)}
              items={Object.fromEntries([
                ["__none__", "Не закреплён"],
                ...activeEmployees.map((emp) => [emp.id, `${emp.full_name} (${emp.position ?? "—"})`]),
              ])}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите сотрудника" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Не закреплён</SelectItem>
                {activeEmployees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.position ?? "—"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}

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
              {pending ? "Сохранение…" : "Сохранить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}