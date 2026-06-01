"use client";

import { useState, useEffect, useTransition } from "react";
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
import { Check } from "lucide-react";
import { updateDeviceDialog } from "@/lib/actions/devices";
import { clearCache } from "@/lib/actions/revalidate";
import { useRouter } from "next/navigation";
import type { Tables } from "@/types/database.types";
import { Camera, Image as ImageIcon, X } from "lucide-react";

type Device = Tables<"devices">;
type Hardware = {
  cpu?: string;
  ram?: string;
  storage?: string;
  gpu?: string;
  mac_address?: string;
  diagonal?: string;
  resolution?: string;
};

const editDeviceSchema = z.object({
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

type EditDeviceValues = z.infer<typeof editDeviceSchema>;

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

interface EditDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device;
  templates: Tables<"computer_templates">[];
}

export function EditDeviceDialog({ open, onOpenChange, device, templates }: EditDeviceDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const hw = (device.hardware as Hardware | null) ?? {};

  const form = useForm<EditDeviceValues>({
    resolver: zodResolver(editDeviceSchema),
    defaultValues: {
      inventory_number: device.inventory_number,
      serial_number: device.serial_number ?? "",
      mac_address: hw.mac_address ?? "",
      computer_type: device.computer_type ?? "",
      room: device.room ?? "",
      lifecycle_status: device.lifecycle_status as "active" | "repair" | "storage" | "decommissioned",
      device_type: device.device_type as "pc" | "monitor" | "keyboard" | "mouse" | "printer" | "other",
      cpu: hw.cpu ?? "",
      ram: hw.ram ?? "",
      storage: hw.storage ?? "",
      gpu: hw.gpu ?? "",
      diagonal: hw.diagonal ?? "",
      resolution: hw.resolution ?? "",
      template_id: device.template_id ?? "",
    },
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...filesArray]);

      const previewsArray = filesArray.map((file) => URL.createObjectURL(file));
      setPhotoPreviews((prev) => [...prev, ...previewsArray]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingPhoto = (index: number) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const deviceType = form.watch("device_type");

  const templateItems: Record<string, React.ReactNode> = {
    "": "Без шаблона",
    ...Object.fromEntries(templates.map((t) => [t.id, t.name])),
  };

  // Reset form values when device changes or dialog opens
  useEffect(() => {
    if (open) {
      const currentHw = (device.hardware as Hardware | null) ?? {};
      form.reset({
        inventory_number: device.inventory_number,
        serial_number: device.serial_number ?? "",
        mac_address: currentHw.mac_address ?? "",
        computer_type: device.computer_type ?? "",
        room: device.room ?? "",
        lifecycle_status: device.lifecycle_status as "active" | "repair" | "storage" | "decommissioned",
        device_type: device.device_type as "pc" | "monitor" | "keyboard" | "mouse" | "printer" | "other",
        cpu: currentHw.cpu ?? "",
        ram: currentHw.ram ?? "",
        storage: currentHw.storage ?? "",
        gpu: currentHw.gpu ?? "",
        diagonal: currentHw.diagonal ?? "",
        resolution: currentHw.resolution ?? "",
        template_id: device.template_id ?? "",
      });
      setError(null);
      setPhotos([]);
      setPhotoPreviews([]);
      setExistingPhotos((device.photo_urls as string[] | null) ?? []);
    }
  }, [open, device, form]);

  const onSubmit = async (data: EditDeviceValues) => {
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

    // Combine existing and new photos
    const photoUrls = [...existingPhotos];
    // Upload new photos if any
    try {
      if (photos.length > 0) {
        const { compressImageToTarget } = await import("@/lib/image/compressImage");
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        for (const file of photos) {
          let fileToUpload = file;
          try {
            const compressionResult = await compressImageToTarget(file);
            fileToUpload = compressionResult.file;
            console.log(`Original: ${Math.round(file.size / 1024)}KB, Compressed: ${compressionResult.finalSizeKB}KB`);
          } catch (compressErr) {
            console.warn("Compression failed, using original:", compressErr);
          }

          const fileExt = fileToUpload.name.split(".").pop();
          const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto 
            ? crypto.randomUUID() 
            : `${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
          const fileName = `${uuid}.${fileExt}`;
          const filePath = `devices/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from("ticket-attachments")
            .upload(filePath, fileToUpload, {
              contentType: fileToUpload.type,
              upsert: false,
            });

          if (uploadError) {
            toast.error(`Ошибка при загрузке фото ${file.name}`);
            setPending(false);
            return;
          }

          const { data: { publicUrl } } = supabase.storage
            .from("ticket-attachments")
            .getPublicUrl(filePath);

          photoUrls.push(publicUrl);
        }
      }
    } catch (err) {
      console.error("Device photo upload exception:", err);
      toast.error("Не удалось загрузить новые фотографии устройства");
      setPending(false);
      return;
    }

    formData.set("photo_urls", JSON.stringify(photoUrls));

    const result = await updateDeviceDialog(device.id, formData);
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
    await clearCache(`/devices/${device.id}`);
    await clearCache('/dashboard');
    toast.success("Устройство успешно обновлено");
    form.reset();
    onOpenChange(false);
    startTransition(() => { router.refresh(); });
    setPending(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) {
        setError(null);
        setPhotos([]);
        setPhotoPreviews((prev) => {
          prev.forEach((url) => URL.revokeObjectURL(url));
          return [];
        });
      }
    }}>
      <DialogContent className="sm:max-w-[580px] bg-white rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Редактировать устройство</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Измените данные IT-устройства
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          {/* 1. Device Type Selection */}
          <div className="space-y-2">
            <Label>Тип устройства *</Label>
            <Select
              value={deviceType}
              onValueChange={(val) => {
                if (val) {
                  form.setValue("device_type", val);
                  if (val === "pc") {
                    form.setValue("computer_type", "desktop");
                  } else {
                    form.setValue("computer_type", "");
                  }
                }
              }}
              items={DEVICE_TYPE_ITEMS}
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
              <Label>Шаблон конфигурации</Label>
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
          )}

          {/* Inventory and Serial Numbers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_inventory_number">Инв. номер *</Label>
              <Input
                id="edit_inventory_number"
                placeholder="DEV-008"
                {...form.register("inventory_number")}
              />
              {form.formState.errors.inventory_number && (
                <p className="text-xs text-destructive">{form.formState.errors.inventory_number.message}</p>
              )}
            </div>

            {deviceType === "pc" ? (
              <div className="space-y-2">
                <Label htmlFor="edit_serial_number">Серийный номер</Label>
                <Input
                  id="edit_serial_number"
                  placeholder="SN-PC-XYZ"
                  {...form.register("serial_number")}
                />
              </div>
            ) : (
              <input type="hidden" {...form.register("serial_number")} />
            )}
          </div>

          {/* Dynamic Name / Subtype field */}
          <div className="grid grid-cols-2 gap-4">
            {deviceType === "pc" ? (
              <div className="space-y-2">
                <Label>Тип ПК *</Label>
                <Select
                  value={form.watch("computer_type")}
                  onValueChange={(v) => form.setValue("computer_type", v ?? "desktop")}
                  items={PC_SUBTYPE_ITEMS}
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
                <Label htmlFor="edit_computer_type">Название / Модель *</Label>
                <Input
                  id="edit_computer_type"
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
              <Label htmlFor="edit_room">Кабинет *</Label>
              <Input
                id="edit_room"
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
                onValueChange={(v) => form.setValue("lifecycle_status", v as "active" | "repair" | "storage" | "decommissioned")}
                items={STATUS_ITEMS}
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
                <Label htmlFor="edit_mac_address">MAC-адрес</Label>
                <Input
                  id="edit_mac_address"
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
                  <Label htmlFor="edit_cpu">CPU *</Label>
                  <Input id="edit_cpu" placeholder="Intel Core i5-12400" {...form.register("cpu")} />
                  {form.formState.errors.cpu && (
                    <p className="text-xs text-destructive">{form.formState.errors.cpu.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_ram">RAM</Label>
                  <Input id="edit_ram" placeholder="16 GB" {...form.register("ram")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_storage">Накопитель</Label>
                  <Input id="edit_storage" placeholder="512 GB SSD" {...form.register("storage")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_gpu">GPU</Label>
                  <Input id="edit_gpu" placeholder="NVIDIA RTX 3060" {...form.register("gpu")} />
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
                  <Label htmlFor="edit_diagonal">Диагональ *</Label>
                  <Input id="edit_diagonal" placeholder="24 дюйма" {...form.register("diagonal")} />
                  {form.formState.errors.diagonal && (
                    <p className="text-xs text-destructive">{form.formState.errors.diagonal.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_resolution">Разрешение *</Label>
                  <Input id="edit_resolution" placeholder="1920x1080" {...form.register("resolution")} />
                  {form.formState.errors.resolution && (
                    <p className="text-xs text-destructive">{form.formState.errors.resolution.message}</p>
                  )}
                </div>
              </div>
            </>
          )}
          {/* Photo attachment field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5 text-gray-700">
              <Camera className="w-4 h-4 text-gray-500" />
              Фотографии устройства
            </Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-center border border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  disabled={pending}
                />
                <div className="text-center space-y-1">
                  <ImageIcon className="w-6 h-6 text-gray-400 mx-auto" />
                  <span className="text-xs text-gray-500 block">Нажмите, чтобы выбрать фото устройства</span>
                </div>
              </label>

              {/* Existing Photos Previews */}
              {existingPhotos.length > 0 && (
                <div className="space-y-1 mt-2">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Текущие фото</span>
                  <div className="grid grid-cols-4 gap-2">
                    {existingPhotos.map((url, index) => (
                      <div key={`existing-${index}`} className="relative aspect-square rounded-lg border overflow-hidden group">
                        <img src={url} alt="Устройство" className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(index)}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-black/90 text-white rounded-full p-1 cursor-pointer transition-colors"
                          title="Удалить"
                          disabled={pending}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Photos Previews */}
              {photoPreviews.length > 0 && (
                <div className="space-y-1 mt-2">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Новые фото</span>
                  <div className="grid grid-cols-4 gap-2">
                    {photoPreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="relative aspect-square rounded-lg border overflow-hidden group">
                        <img src={preview} alt="Превью" className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-black/90 text-white rounded-full p-1 cursor-pointer transition-colors"
                          title="Удалить"
                          disabled={pending}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              onClick={() => { onOpenChange(false); }}
              disabled={pending}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
            >
              <Check className="w-4 h-4" />
              {pending ? "Сохранение…" : "Сохранить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}