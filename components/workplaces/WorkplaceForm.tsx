"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Tables } from "@/types/database.types";

type Workplace = Tables<"workplaces">;
type Computer = Pick<Tables<"computers">, "id" | "inventory_number">;
type Employee = Pick<Tables<"employees">, "id" | "full_name">;

interface WorkplaceFormProps {
  workplace?: Workplace;
  computers: Computer[];
  employees: Employee[];
  action: (formData: FormData) => Promise<{ error?: string } | void>;
}

const initialState = { error: "" };

export default function WorkplaceForm({ workplace, computers, employees, action }: WorkplaceFormProps) {
  const computerItems: Record<string, React.ReactNode> = Object.fromEntries([
    ["", "— Не выбран —"],
    ...computers.map((c) => [c.id, c.inventory_number]),
  ]);
  const employeeItems: Record<string, React.ReactNode> = Object.fromEntries([
    ["", "— Не назначен —"],
    ...employees.map((e) => [e.id, e.full_name]),
  ]);

  const [state, formAction, pending] = useActionState(
    async (_: typeof initialState, formData: FormData) => {
      const result = await action(formData);
      return (result as typeof initialState) ?? initialState;
    },
    initialState
  );

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      <div className="space-y-2">
        <Label htmlFor="room">Кабинет *</Label>
        <Input id="room" name="room" placeholder="101" defaultValue={workplace?.room} required />
      </div>

      <div className="space-y-2">
        <Label>Компьютер</Label>
        <Select name="computer_id" defaultValue={workplace?.computer_id ?? ""} items={computerItems}>
          <SelectTrigger><SelectValue placeholder="Не выбран" /></SelectTrigger>
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
        <Select name="employee_id" defaultValue={workplace?.employee_id ?? ""} items={employeeItems}>
          <SelectTrigger><SelectValue placeholder="Не назначен" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">— Не назначен —</SelectItem>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {state.error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{state.error}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Сохранение…" : workplace ? "Сохранить" : "Создать"}
      </Button>
    </form>
  );
}
