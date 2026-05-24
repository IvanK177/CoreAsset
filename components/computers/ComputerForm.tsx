"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Tables } from "@/types/database.types";

type Computer = Tables<"computers">;
type Hardware = { cpu?: string; ram?: string; storage?: string };

interface ComputerFormProps {
  computer?: Computer;
  action: (formData: FormData) => Promise<{ error?: string } | void>;
}

const LIFECYCLE_STATUS_ITEMS: Record<string, React.ReactNode> = {
  active: "Активен",
  repair: "В ремонте",
  storage: "Склад",
  decommissioned: "Списан",
};
const initialState = { error: "" };

export default function ComputerForm({ computer, action }: ComputerFormProps) {
  const hw = computer?.hardware as Hardware | null;

  const [state, formAction, pending] = useActionState(
    async (_: typeof initialState, formData: FormData) => {
      const result = await action(formData);
      return (result as typeof initialState) ?? initialState;
    },
    initialState
  );

  return (
    <form action={formAction} className="space-y-6 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="inventory_number">Инвентарный номер *</Label>
          <Input id="inventory_number" name="inventory_number" defaultValue={computer?.inventory_number} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="serial_number">Серийный номер</Label>
          <Input id="serial_number" name="serial_number" defaultValue={computer?.serial_number ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="computer_type">Тип *</Label>
          <Input id="computer_type" name="computer_type" defaultValue={computer?.computer_type ?? "desktop"} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="room">Кабинет</Label>
          <Input id="room" name="room" defaultValue={computer?.room ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Статус *</Label>
        <Select name="lifecycle_status" defaultValue={computer?.lifecycle_status ?? "active"} items={LIFECYCLE_STATUS_ITEMS}>
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

      <Separator />
      <p className="text-sm font-medium text-muted-foreground">Характеристики (опционально)</p>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cpu">CPU</Label>
          <Input id="cpu" name="cpu" placeholder="i5-12400" defaultValue={hw?.cpu ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ram">RAM</Label>
          <Input id="ram" name="ram" placeholder="16 GB" defaultValue={hw?.ram ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="storage">Диск</Label>
          <Input id="storage" name="storage" placeholder="512 GB SSD" defaultValue={hw?.storage ?? ""} />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="gap-2">
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        {pending ? "Сохранение…" : computer ? "Сохранить" : "Добавить"}
      </Button>
    </form>
  );
}
