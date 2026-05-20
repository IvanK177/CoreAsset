"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createIncident } from "@/lib/actions/incidents";
import type { Tables } from "@/types/database.types";

type Computer = Pick<Tables<"computers">, "id" | "inventory_number">;
const initialState = { error: "" };

export default function NewIncidentClient({ computers, defaultComputerId }: { computers: Computer[]; defaultComputerId?: string }) {
  const [state, formAction, pending] = useActionState(
    async (_: typeof initialState, formData: FormData) => {
      const result = await createIncident(formData);
      return (result as typeof initialState) ?? initialState;
    },
    initialState
  );

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      <div className="space-y-2">
        <Label>Компьютер</Label>
        <Select name="computer_id" defaultValue={defaultComputerId ?? ""}>
          <SelectTrigger><SelectValue placeholder="Не привязан" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">— Не выбран —</SelectItem>
            {computers.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.inventory_number}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Тип *</Label>
          <Select name="incident_type" defaultValue="other">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hardware">Железо</SelectItem>
              <SelectItem value="software">ПО</SelectItem>
              <SelectItem value="network">Сеть</SelectItem>
              <SelectItem value="other">Прочее</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Приоритет *</Label>
          <Select name="priority" defaultValue="medium">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Низкий</SelectItem>
              <SelectItem value="medium">Средний</SelectItem>
              <SelectItem value="high">Высокий</SelectItem>
              <SelectItem value="critical">Критичный</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Описание *</Label>
        <Textarea id="description" name="description" rows={4} required />
      </div>

      {state.error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>{pending ? "Создание…" : "Создать тикет"}</Button>
    </form>
  );
}
