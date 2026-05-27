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
import { createComputerDialog } from "@/lib/actions/computers";
import { clearCache } from "@/lib/actions/revalidate";
import { useRouter } from "next/navigation";
import type { Tables } from "@/types/database.types";

const computerDialogSchema = z.object({
  inventory_number: z.string().min(1, "Обязательное поле"),
  serial_number: z.string().optional().or(z.literal("")),
  mac_address: z.string().optional().or(z.literal("")),
  computer_type: z.string().min(1, "Обязательное поле"),
  room: z.string().min(1, "Обязательное поле"),
  lifecycle_status: z.enum(["active", "repair", "storage", "decommissioned"]),
  cpu: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),
  gpu: z.string().optional(),
  template_id: z.string().optional().nullable().or(z.literal("")),
});

type ComputerDialogValues = z.infer<typeof computerDialogSchema>;

const COMPUTER_TYPE_ITEMS: Record<string, React.ReactNode> = {
  desktop: "PC",
  laptop: "Laptop",
  server: "Server",
};

const STATUS_ITEMS: Record<string, React.ReactNode> = {
  active: "Вакантен",
  repair: "В ремонте",
  storage: "На складе",
  decommissioned: "Списан",
};

interface AddComputerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: Tables<"computer_templates">[];
}

export function AddComputerDialog({ open, onOpenChange, templates }: AddComputerDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<ComputerDialogValues>({
    resolver: zodResolver(computerDialogSchema),
    defaultValues: {
      inventory_number: "",
      serial_number: "",
      mac_address: "",
      computer_type: "desktop",
      room: "",
      lifecycle_status: "active",
      cpu: "",
      ram: "",
      storage: "",
      gpu: "",
      template_id: "",
    },
  });

  const templateItems: Record<string, React.ReactNode> = {
    "": "Без шаблона",
    ...Object.fromEntries(templates.map((t) => [t.id, t.name])),
  };

  const onSubmit = async (data: ComputerDialogValues) => {
    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("inventory_number", data.inventory_number);
    if (data.serial_number) formData.set("serial_number", data.serial_number);
    if (data.mac_address) formData.set("mac_address", data.mac_address);
    formData.set("computer_type", data.computer_type);
    formData.set("room", data.room);
    formData.set("lifecycle_status", data.lifecycle_status);
    if (data.cpu) formData.set("cpu", data.cpu);
    if (data.ram) formData.set("ram", data.ram);
    if (data.storage) formData.set("storage", data.storage);
    if (data.gpu) formData.set("gpu", data.gpu);
    if (data.template_id) formData.set("template_id", data.template_id);

    const result = await createComputerDialog(formData);
    if (result.error) {
      if (result.code === "23505") {
        toast.error("Компьютер с таким серийным номером уже существует");
        form.setError("serial_number", { message: "Серийный номер уже зарегистрирован в системе" });
      } else {
        toast.error("Ошибка при сохранении: " + result.error);
        setError(result.error);
      }
      setPending(false);
      return;
    }

    await clearCache('/computers');
    await clearCache('/dashboard');
    toast.success("Компьютер успешно добавлен");
    form.reset();
    onOpenChange(false);
    startTransition(() => { router.refresh(); });
    setPending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] bg-white rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Добавить компьютер</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Заполните данные для добавления нового устройства
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Template Selection Dropdown */}
          <div className="space-y-2">
            <Label>Шаблон конфигурации (по желанию)</Label>
            <Select
              value={form.watch("template_id") || ""}
              onValueChange={(val) => {
                form.setValue("template_id", val);
                if (val) {
                  const selectedTemplate = templates.find((t) => t.id === val);
                  if (selectedTemplate) {
                    form.setValue("computer_type", selectedTemplate.computer_type || "desktop");
                    const hw = selectedTemplate.hardware as { cpu?: string; ram?: string; storage?: string; gpu?: string } | null;
                    if (hw) {
                      form.setValue("cpu", hw.cpu || "");
                      form.setValue("ram", hw.ram || "");
                      form.setValue("storage", hw.storage || "");
                      form.setValue("gpu", hw.gpu || "");
                    }
                    toast.success(`Характеристики заполнены из шаблона "${selectedTemplate.name}"`);
                  }
                } else {
                  form.setValue("template_id", "");
                }
              }}
              items={templateItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите шаблон..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Без шаблона</SelectItem>
                {templates.map((tpl) => (
                  <SelectItem key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Main fields — 2 columns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inventory_number">Инвентарный номер *</Label>
              <Input
                id="inventory_number"
                placeholder="PC-008"
                {...form.register("inventory_number")}
              />
              {form.formState.errors.inventory_number && (
                <p className="text-xs text-destructive">{form.formState.errors.inventory_number.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="serial_number">Серийный номер</Label>
              <Input
                id="serial_number"
                placeholder="SN-XYZ-008"
                {...form.register("serial_number")}
              />
              {form.formState.errors.serial_number && (
                <p className="text-xs text-destructive">{form.formState.errors.serial_number.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mac_address">MAC-адрес *</Label>
              <Input
                id="mac_address"
                placeholder="00:1A:2B:3C:4D:5F"
                {...form.register("mac_address")}
              />
              {form.formState.errors.mac_address && (
                <p className="text-xs text-destructive">{form.formState.errors.mac_address.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Тип</Label>
              <Select
                value={form.watch("computer_type")}
                onValueChange={(v) => form.setValue("computer_type", v ?? "desktop")}
                items={COMPUTER_TYPE_ITEMS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desktop">PC</SelectItem>
                  <SelectItem value="laptop">Laptop</SelectItem>
                  <SelectItem value="server">Server</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room">Кабинет *</Label>
              <Input
                id="room"
                placeholder="204"
                {...form.register("room")}
              />
              {form.formState.errors.room && (
                <p className="text-xs text-destructive">{form.formState.errors.room.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select
                value={form.watch("lifecycle_status")}
                onValueChange={(v) => form.setValue("lifecycle_status", v as ComputerDialogValues["lifecycle_status"])}
                items={STATUS_ITEMS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Вакантен</SelectItem>
                  <SelectItem value="repair">В ремонте</SelectItem>
                  <SelectItem value="storage">На складе</SelectItem>
                  <SelectItem value="decommissioned">Списан</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Separator / Subtitle */}
          <div className="flex items-center gap-2 pt-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-blue-500/70 uppercase tracking-wide">
              Характеристики (опционально)
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Hardware fields — 2 columns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpu">CPU</Label>
              <Input id="cpu" placeholder="Intel Core i5-12400" {...form.register("cpu")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ram">RAM</Label>
              <Input id="ram" placeholder="16 GB" {...form.register("ram")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storage">Накопитель</Label>
              <Input id="storage" placeholder="512 GB SSD" {...form.register("storage")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpu">GPU</Label>
              <Input id="gpu" placeholder="NVIDIA RTX 3060" {...form.register("gpu")} />
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