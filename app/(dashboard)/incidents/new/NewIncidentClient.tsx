"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createIncident } from "@/lib/actions/incidents";
import type { Tables } from "@/types/database.types";

type Computer = Pick<Tables<"computers">, "id" | "inventory_number">;
type Employee = Pick<Tables<"employees">, "id" | "full_name">;
const INCIDENT_TYPE_ITEMS: Record<string, React.ReactNode> = {
  hardware: "Железо",
  software: "ПО",
  network: "Сеть",
  other: "Прочее",
};
const PRIORITY_ITEMS: Record<string, React.ReactNode> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  critical: "Критичный",
};
const initialState = { error: "" };

const getLocalDateTimeString = (date: Date = new Date()) => {
  const tzoffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
};

export default function NewIncidentClient({ computers, employees, defaultComputerId }: { computers: Computer[]; employees: Employee[]; defaultComputerId?: string }) {
  // Controlled state for computer_id and employee_id — guarantees the hidden input value
  // always matches the current selection, bypassing @base-ui/react Select's
  // internal hidden-input sync issues with UUID-length values.
  const [computerId, setComputerId] = useState(defaultComputerId ?? "");
  const [employeeId, setEmployeeId] = useState("");

  const computerItems: Record<string, React.ReactNode> = Object.fromEntries([
    ["", "— Не выбран —"],
    ...computers.map((c) => [c.id, c.inventory_number]),
  ]);
  const employeeItems: Record<string, React.ReactNode> = Object.fromEntries([
    ["", "— Не указан —"],
    ...employees.map((e) => [e.id, e.full_name]),
  ]);
  const [state, formAction, pending] = useActionState(
    async (_: typeof initialState, formData: FormData) => {
      const result = await createIncident(formData);
      return (result as typeof initialState) ?? initialState;
    },
    initialState
  );

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      {/* Only include computer_id/employee_id in form data when actually
          selected. When empty, omitting the field ensures formData.get()
          returns null → undefined via emptyToUndefined(), avoiding "Invalid UUID". */}
      {computerId && <input type="hidden" name="computer_id" value={computerId} />}
      {employeeId && <input type="hidden" name="employee_id" value={employeeId} />}

      <div className="space-y-2">
        <Label htmlFor="title">Заголовок *</Label>
        <Input id="title" name="title" placeholder="Опишите проблему кратко" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="created_at">Время инцидента *</Label>
        <Input
          id="created_at"
          name="created_at"
          type="datetime-local"
          defaultValue={getLocalDateTimeString()}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Компьютер</Label>
        <Select value={computerId} onValueChange={(v) => setComputerId(v ?? "")} items={computerItems}>
          <SelectTrigger><SelectValue placeholder="Не привязан" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">— Не выбран —</SelectItem>
            {computers.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.inventory_number}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Сотрудник</Label>
        <Select value={employeeId} onValueChange={(v) => setEmployeeId(v ?? "")} items={employeeItems}>
          <SelectTrigger><SelectValue placeholder="Не указан" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">— Не указан —</SelectItem>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Тип *</Label>
          <Select name="incident_type" defaultValue="other" items={INCIDENT_TYPE_ITEMS}>
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
          <Select name="priority" defaultValue="medium" items={PRIORITY_ITEMS}>
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
