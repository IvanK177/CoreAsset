"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/types/database.types";

type Employee = Tables<"employees">;

interface EmployeeFormProps {
  employee?: Employee;
  action: (formData: FormData) => Promise<{ error?: string } | void>;
}

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
          <Label htmlFor="department">Отдел</Label>
          <Input id="department" name="department" defaultValue={employee?.department ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="position">Должность</Label>
          <Input id="position" name="position" defaultValue={employee?.position ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={employee?.email ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employee_number">Табельный номер</Label>
          <Input id="employee_number" name="employee_number" defaultValue={employee?.employee_number ?? ""} />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{state.error}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Сохранение…" : employee ? "Сохранить" : "Добавить"}
      </Button>
    </form>
  );
}
