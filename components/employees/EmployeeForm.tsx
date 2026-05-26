"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Tables } from "@/types/database.types";

type Employee = Tables<"employees">;

interface EmployeeFormProps {
  employee?: Employee;
  action: (formData: FormData) => Promise<{ error?: string } | void>;
}

const ROLE_ITEMS: Record<string, React.ReactNode> = {
  employee: "Сотрудник",
  admin: "Администратор",
  it_specialist: "IT-специалист",
};

const initialState = { error: "" };

export default function EmployeeForm({ employee, action }: EmployeeFormProps) {
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
        <Label htmlFor="full_name">ФИО *</Label>
        <Input id="full_name" name="full_name" defaultValue={employee?.full_name} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="position">Должность *</Label>
          <Input id="position" name="position" defaultValue={employee?.position ?? ""} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="room">Кабинет</Label>
          <Input id="room" name="room" defaultValue={employee?.room ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={employee?.email ?? ""} />
        </div>
        <div className="space-y-2">
          <Label>Роль</Label>
          <Select name="role" defaultValue={employee?.role ?? "employee"} items={ROLE_ITEMS}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employee">Сотрудник</SelectItem>
              <SelectItem value="admin">Администратор</SelectItem>
              <SelectItem value="it_specialist">IT-специалист</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Телефон</Label>
          <Input id="phone" name="phone" defaultValue={employee?.phone ?? ""} placeholder="+7-900-000-0000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telegram">Telegram</Label>
          <Input id="telegram" name="telegram" defaultValue={employee?.telegram ?? ""} placeholder="@username" />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="gap-2">
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        {pending ? "Сохранение…" : employee ? "Сохранить" : "Добавить"}
      </Button>
    </form>
  );
}
