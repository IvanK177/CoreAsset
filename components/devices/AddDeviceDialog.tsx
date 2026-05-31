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
import { createDeviceDialog } from "@/lib/actions/devices";
import { clearCache } from "@/lib/actions/revalidate";
import { useRouter } from "next/navigation";
import type { Tables } from "@/types/database.types";

const deviceDialogSchema = z.object({
  inventory_number: z.string().min(1, "Обязательное поле"),
  serial_number: z.string().optional().or(z.literal("")),
  mac_address: z.string().optional().or(z.literal("")),
  computer_type: z.string().min(1, "Обязательное поле"), // DB column name used as Subtype/Model name
  room: z.string().min(1, "Обязательное поле"),
  lifecycle_status: z.enum(["active", "repair", "storage", "decommissioned"]),
  device_type: z.enum(["pc", "monitor", "keyboard", "mouse", "printer", "other"]),
  cpu: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),
  gpu: z.string().optional(),
  diagonal: z.string().optional(),
  resolution: z.string().optional(),
  template_id: z.string().optional().nullable().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.device_type === "pc") {
    if (!data.cpu || !data.cpu.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Процессор обязателен для ПК",
        path: ["cpu"],
      });
    }
  } else if (data.device_type === "monitor") {
    if (!data.diagonal || !data.diagonal.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Диагональ обязательна для монитора",
        path: ["diagonal"],
      });
    }
    if (!data.resolution || !data.resolution.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Разрешение обязательно для монитора",
        path: ["resolution"],
      });
    }
  }
});

type DeviceDialogValues = z.infer<typeof deviceDialogSchema>;

const DEVICE_TYPE_ITEMS: Record<string, React.ReactNode> = {
  pc: "Компьютер / Ноутбук",
  monitor: "Монитор",
  keyboard: "Клавиатура",
  mouse: "Мышь",
  printer: "Оргтехника (Принтер)",
  other: "Другое",
};

const PC_SUBTYPE_ITEMS: Record<string, React.ReactNode> = {
  desktop: "PC / Десктоп",
  laptop: "Ноутбук",
  server: "Сервер",
};

const STATUS_ITEMS: Record<string, React.ReactNode> = {
  active: "Вакантен",
  repair: "В ремонте",
  storage: "На складе",
  decommissioned: "Списан",
};

interface AddDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: Tables<"computer_templates">[];
}

export function AddDeviceDialog({ open, onOpenChange, templates }: AddDeviceDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<DeviceDialogValues>({
    resolver: zodResolver(deviceDialogSchema),
    defaultValues: {
      inventory_number: "",
      serial_number: "",
      mac_address: "",
      computer_type: "desktop",
      room: "",
      lifecycle_status: "active",
      device_type: "pc",
      cpu: "",
      ram: "",
      storage: "",
      gpu: "",
      diagonal: "",
      resolution: "",
      template_id: "",
    },
  });

  const deviceType = form.watch("device_type");

  const templateItems: Record<string, React.ReactNode> = {
    "": "Без шаблона",
    ...Object.fromEntries(templates.map((t) => [t.id, t.name])),
  };

  const onSubmit = async (data: DeviceDialogValues) => {
    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("inventory_number", data.inventory_number);
    formData.set("device_type", data.device_type);
    formData.set("computer_type", data.computer_type);
    formData.set("room", data.room);
    formData.set("lifecycle_status", data.lifecycle_status);
    
    if (data.serial_number) formData.set("serial_number", data.serial_number);
    if (data.template_id) formData.set("template_id", data.template_id);

    if (data.device_type === "pc") {
      if (data.mac_address) formData.set("mac_address", data.mac_address);
      if (data.cpu) formData.set("cpu", data.cpu);
      if (data.ram) formData.set("ram", data.ram);
      if (data.storage) formData.set("storage", data.storage);
      if (data.gpu) formData.set("gpu", data.gpu);
    } else if (data.device_type === "monitor") {
      if (data.diagonal) formData.set("diagonal", data.diagonal);
      if (data.resolution) formData.set("resolution", data.resolution);
    }

    const result = await createDeviceDialog(formData);
    if (result.error) {
      if (result.code === "23505") {
        toast.error("Устройство с таким серийным/инвентарным номером уже существует");
        form.setError("inventory_number", { message: "Инвентарный или серийный номер уже зарегистрирован в системе" });
      } else {
        toast.error("Ошибка при сохранении: " + result.error);
        setError(result.error);
      }
      setPending(false);
      return;
    }

    await clearCache('/devices');
    await clearCache('/dashboard');
    toast.success("Устройство успешно добавлено");
    form.reset();
    onOpenChange(false);
    startTransition(() => { router.refresh(); });
    setPending(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) {
        form.reset();
        setError(null);
      }
    }}>
      <DialogContent className="sm:max-w-[580px] bg-white rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Добавить устройство</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Заполните данные для добавления нового IT-устройства
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          {/* 1. Device Type Selection (First field!) */}
          <div className="space-y-2">
            <Label>Тип устройства *</Label>
            <Select
              value={deviceType}
              onValueChange={(val: any) => {
                form.setValue("device_type", val);
                if (val === "pc") {
                  form.setValue("computer_type", "desktop");
                } else {
                  form.setValue("computer_type", "");
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DEVICE_TYPE_ITEMS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PC Template Selection */}
          {deviceType === "pc" && (
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
          )}

          {/* Inventory and Serial Numbers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inventory_number">Инвентарный номер *</Label>
              <Input
                id="inventory_number"
                placeholder="DEV-008"
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

          {/* Dynamic Name / Subtype field */}
          <div className="grid grid-cols-2 gap-4">
            {deviceType === "pc" ? (
              <div className="space-y-2">
                <Label>Тип ПК *</Label>
                <Select
                  value={form.watch("computer_type")}
                  onValueChange={(v) => form.setValue("computer_type", v ?? "desktop")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PC_SUBTYPE_ITEMS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="computer_type">Название / Модель *</Label>
                <Input
                  id="computer_type"
                  placeholder={
                    deviceType === "monitor"
                      ? "Dell U2412M"
                      : deviceType === "keyboard"
                      ? "Logitech K120"
                      : "Модель устройства"
                  }
                  {...form.register("computer_type")}
                />
                {form.formState.errors.computer_type && (
                  <p className="text-xs text-destructive">{form.formState.errors.computer_type.message}</p>
                )}
              </div>
            )}

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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Статус *</Label>
              <Select
                value={form.watch("lifecycle_status")}
                onValueChange={(v) => form.setValue("lifecycle_status", v as any)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_ITEMS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {deviceType === "pc" && (
              <div className="space-y-2">
                <Label htmlFor="mac_address">MAC-адрес</Label>
                <Input
                  id="mac_address"
                  placeholder="00:1A:2B:3C:4D:5F"
                  {...form.register("mac_address")}
                />
                {form.formState.errors.mac_address && (
                  <p className="text-xs text-destructive">{form.formState.errors.mac_address.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Dynamic characteristics Depending on Device Type */}
          {deviceType === "pc" && (
            <>
              <div className="flex items-center gap-2 pt-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-blue-500/70 uppercase tracking-wide">
                  Характеристики ПК (опционально)
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpu">CPU *</Label>
                  <Input id="cpu" placeholder="Intel Core i5-12400" {...form.register("cpu")} />
                  {form.formState.errors.cpu && (
                    <p className="text-xs text-destructive">{form.formState.errors.cpu.message}</p>
                  )}
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
            </>
          )}

          {deviceType === "monitor" && (
            <>
              <div className="flex items-center gap-2 pt-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-blue-500/70 uppercase tracking-wide">
                  Характеристики Монитора
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="diagonal">Диагональ *</Label>
                  <Input id="diagonal" placeholder="24 дюйма" {...form.register("diagonal")} />
                  {form.formState.errors.diagonal && (
                    <p className="text-xs text-destructive">{form.formState.errors.diagonal.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resolution">Разрешение *</Label>
                  <Input id="resolution" placeholder="1920x1080" {...form.register("resolution")} />
                  {form.formState.errors.resolution && (
                    <p className="text-xs text-destructive">{form.formState.errors.resolution.message}</p>
                  )}
                </div>
              </div>
            </>
          )}

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