"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createLicensePool } from "@/lib/actions/licenses";
import type { Tables } from "@/types/database.types";

type Software = Pick<Tables<"software">, "id" | "name" | "version">;
const initialState = { error: "" };

export default function NewLicensePoolClient({ software }: { software: Software[] }) {
  const [state, formAction, pending] = useActionState(
    async (_: typeof initialState, formData: FormData) => {
      const result = await createLicensePool(formData);
      return (result as typeof initialState) ?? initialState;
    },
    initialState
  );

  return (
    <form action={formAction} className="space-y-5 max-w-md">
      <div className="space-y-2">
        <Label>Программа *</Label>
        <Select name="software_id" required>
          <SelectTrigger><SelectValue placeholder="Выберите ПО" /></SelectTrigger>
          <SelectContent>
            {software.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}{s.version ? ` v${s.version}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Тип *</Label>
          <Select name="license_type" defaultValue="perpetual">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="perpetual">Бессрочная</SelectItem>
              <SelectItem value="subscription">Подписка</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="total_seats">Кол-во мест *</Label>
          <Input id="total_seats" name="total_seats" type="number" min="1" defaultValue="1" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expires_at">Дата истечения</Label>
        <Input id="expires_at" name="expires_at" type="date" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Примечание</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>

      {state.error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>{pending ? "Сохранение…" : "Добавить пул"}</Button>
    </form>
  );
}
