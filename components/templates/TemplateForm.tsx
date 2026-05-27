"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { ComputerTemplateRow } from "@/lib/schemas/computer_template.schema";
import { safeHardware } from "@/lib/utils";

interface TemplateFormProps {
  template?: ComputerTemplateRow;
  action: (formData: FormData) => Promise<{ error?: string } | void>;
}

const COMPUTER_TYPE_ITEMS: Record<string, React.ReactNode> = {
  desktop: "PC / Десктоп",
  laptop: "Ноутбук",
  monoblock: "Моноблок",
  server: "Сервер",
};

const initialState = { error: "" };

export default function TemplateForm({ template, action }: TemplateFormProps) {
  const [state, formAction, pending] = useActionState(
    async (_: typeof initialState, formData: FormData) => {
      const result = await action(formData);
      return (result as typeof initialState) ?? initialState;
    },
    initialState
  );

  const hw = safeHardware(template?.hardware);

  return (
    <form action={formAction} className="space-y-5 max-w-lg bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="name">Название шаблона *</Label>
        <Input id="name" name="name" defaultValue={template?.name} placeholder="Например: ПК Разработчика" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Описание</Label>
        <Textarea id="description" name="description" defaultValue={template?.description ?? ""} placeholder="Описание назначения сборки..." rows={2} />
      </div>

      <div className="space-y-2">
        <Label>Тип устройства *</Label>
        <Select name="computer_type" defaultValue={template?.computer_type ?? "desktop"} items={COMPUTER_TYPE_ITEMS}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desktop">PC / Десктоп</SelectItem>
            <SelectItem value="laptop">Ноутбук</SelectItem>
            <SelectItem value="monoblock">Моноблок</SelectItem>
            <SelectItem value="server">Сервер</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SeparatorTitle title="Характеристики железа (по умолчанию)" />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cpu">Процессор (CPU)</Label>
          <Input id="cpu" name="cpu" defaultValue={hw.cpu ?? ""} placeholder="Intel Core i7-13700" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ram">ОЗУ (RAM)</Label>
          <Input id="ram" name="ram" defaultValue={hw.ram ?? ""} placeholder="32 GB DDR5" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="storage">Накопитель (Storage)</Label>
          <Input id="storage" name="storage" defaultValue={hw.storage ?? ""} placeholder="1 TB NVMe SSD" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gpu">Видеокарта (GPU)</Label>
          <Input id="gpu" name="gpu" defaultValue={hw.gpu ?? ""} placeholder="RTX 4060 Ti" />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{state.error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending} className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {pending ? "Сохранение…" : template ? "Сохранить" : "Создать шаблон"}
        </Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={pending}>
          Отмена
        </Button>
      </div>
    </form>
  );
}

function SeparatorTitle({ title }: { title: string }) {
  return (
    <div className="relative py-2">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-start">
        <span className="bg-white pr-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
      </div>
    </div>
  );
}
