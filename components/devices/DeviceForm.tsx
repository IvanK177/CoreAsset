"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Tables } from "@/types/database.types";
import { toast } from "sonner";

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

interface DeviceFormProps {
  device?: Device;
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  templates: Tables<"computer_templates">[];
}

const LIFECYCLE_STATUS_ITEMS: Record<string, React.ReactNode> = {
  active: "Активен",
  repair: "В ремонте",
  storage: "Склад",
  decommissioned: "Списан",
};

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

const initialState = { error: "" };

export default function DeviceForm({ device, action, templates }: DeviceFormProps) {
  const hw = device?.hardware as Hardware | null;

  const [deviceType, setDeviceType] = useState<"pc" | "monitor" | "keyboard" | "mouse" | "printer" | "other">(
    (device?.device_type as any) ?? "pc"
  );
  const [templateId, setTemplateId] = useState(device?.template_id ?? "");
  const [computerType, setComputerType] = useState(device?.computer_type ?? "desktop");
  
  // Hardware state variables
  const [cpu, setCpu] = useState(hw?.cpu ?? "");
  const [ram, setRam] = useState(hw?.ram ?? "");
  const [storage, setStorage] = useState(hw?.storage ?? "");
  const [gpu, setGpu] = useState(hw?.gpu ?? "");
  const [macAddress, setMacAddress] = useState(hw?.mac_address ?? "");
  const [diagonal, setDiagonal] = useState(hw?.diagonal ?? "");
  const [resolution, setResolution] = useState(hw?.resolution ?? "");

  const [state, formAction, pending] = useActionState(
    async (_: typeof initialState, formData: FormData) => {
      const result = await action(formData);
      return (result as typeof initialState) ?? initialState;
    },
    initialState
  );

  const templateItems: Record<string, React.ReactNode> = {
    "": "Без шаблона",
    ...Object.fromEntries(templates.map((t) => [t.id, t.name])),
  };

  return (
    <form action={formAction} className="space-y-6 max-w-lg bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      
      {/* 1. Device Type Selection (First field!) */}
      <div className="space-y-2">
        <Label>Тип устройства *</Label>
        <Select
          name="device_type"
          value={deviceType}
          onValueChange={(val: any) => {
            setDeviceType(val);
            if (val === "pc" && !device) {
              setComputerType("desktop");
            } else if (val !== "pc" && !device) {
              setComputerType("");
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

      {/* PC Specific template selection */}
      {deviceType === "pc" && (
        <div className="space-y-2">
          <Label>Шаблон конфигурации (по желанию)</Label>
          <Select
            name="template_id"
            defaultValue={templateId}
            onValueChange={(val) => {
              setTemplateId(val ?? "");
              if (val) {
                const selectedTemplate = templates.find((t) => t.id === val);
                if (selectedTemplate) {
                  setComputerType(selectedTemplate.computer_type || "desktop");
                  const thw = selectedTemplate.hardware as Hardware | null;
                  if (thw) {
                    setCpu(thw.cpu || "");
                    setRam(thw.ram || "");
                    setStorage(thw.storage || "");
                    setGpu(thw.gpu || "");
                  }
                  toast.success(`Характеристики заполнены из шаблона "${selectedTemplate.name}"`);
                }
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

      {/* Basic identifiers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="inventory_number">Инвентарный номер *</Label>
          <Input id="inventory_number" name="inventory_number" defaultValue={device?.inventory_number} required placeholder="DEV-008" />
        </div>
        <input type="hidden" name="serial_number" value={device?.serial_number ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Dynamic Name / Subtype field */}
        {deviceType === "pc" ? (
          <div className="space-y-2">
            <Label>Тип ПК *</Label>
            <Select name="computer_type" value={computerType} onValueChange={(v) => setComputerType(v ?? "desktop")} items={PC_SUBTYPE_ITEMS}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desktop">PC / Десктоп</SelectItem>
                <SelectItem value="laptop">Ноутбук</SelectItem>
                <SelectItem value="server">Сервер</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="computer_type">Название / Модель *</Label>
            <Input
              id="computer_type"
              name="computer_type"
              value={computerType}
              onChange={(e) => setComputerType(e.target.value)}
              placeholder={
                deviceType === "monitor"
                  ? "Dell U2412M"
                  : deviceType === "keyboard"
                  ? "Logitech K120"
                  : "Модель устройства"
              }
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="room">Кабинет</Label>
          <Input id="room" name="room" defaultValue={device?.room ?? ""} placeholder="204" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Статус *</Label>
          <Select name="lifecycle_status" defaultValue={device?.lifecycle_status ?? "active"} items={LIFECYCLE_STATUS_ITEMS}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Активен</SelectItem>
              <SelectItem value="repair">В ремонте</SelectItem>
              <SelectItem value="storage">Склад</SelectItem>
              <SelectItem value="decommissioned">Списан</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {deviceType === "pc" && (
          <div className="space-y-2">
            <Label htmlFor="mac_address">MAC-адрес</Label>
            <Input id="mac_address" name="mac_address" value={macAddress} onChange={(e) => setMacAddress(e.target.value)} placeholder="00:1A:2B:3C:4D:5F" />
          </div>
        )}
      </div>

      {/* Dynamic specs depending on device type */}
      {deviceType === "pc" && (
        <>
          <Separator />
          <p className="text-sm font-medium text-muted-foreground">Характеристики ПК (опционально)</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpu">Процессор (CPU) *</Label>
              <Input id="cpu" name="cpu" value={cpu} onChange={(e) => setCpu(e.target.value)} placeholder="i5-12400" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ram">ОЗУ (RAM)</Label>
              <Input id="ram" name="ram" value={ram} onChange={(e) => setRam(e.target.value)} placeholder="16 GB" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storage">Накопитель</Label>
              <Input id="storage" name="storage" value={storage} onChange={(e) => setStorage(e.target.value)} placeholder="512 GB SSD" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpu">Видеокарта (GPU)</Label>
              <Input id="gpu" name="gpu" value={gpu} onChange={(e) => setGpu(e.target.value)} placeholder="RTX 3060" />
            </div>
          </div>
        </>
      )}

      {deviceType === "monitor" && (
        <>
          <Separator />
          <p className="text-sm font-medium text-muted-foreground">Характеристики Монитора</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="diagonal">Диагональ *</Label>
              <Input id="diagonal" name="diagonal" value={diagonal} onChange={(e) => setDiagonal(e.target.value)} placeholder="24 дюйма" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolution">Разрешение *</Label>
              <Input id="resolution" name="resolution" value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="1920x1080" />
            </div>
          </div>
        </>
      )}

      {state.error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{state.error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending} className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {pending ? "Сохранение…" : device ? "Сохранить" : "Добавить"}
        </Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={pending}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
