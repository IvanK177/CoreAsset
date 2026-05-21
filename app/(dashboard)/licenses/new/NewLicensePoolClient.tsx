"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createLicensePool } from "@/lib/actions/licenses";
import type { Tables } from "@/types/database.types";
import Link from "next/link";

type Software = Pick<Tables<"software">, "id" | "name" | "version">;
const initialState = { error: "" };

export default function NewLicensePoolClient({ software }: { software: Software[] }) {
  const [selectedSoftwareId, setSelectedSoftwareId] = useState("");
  const [state, formAction, pending] = useActionState(
    async (_: typeof initialState, formData: FormData) => {
      const result = await createLicensePool(formData);
      return (result as typeof initialState) ?? initialState;
    },
    initialState
  );

  const canSubmit = selectedSoftwareId !== "" && !pending;

  return (
    <form action={formAction} className="space-y-5 max-w-md">
      {/* Explicit hidden input guarantees software_id is always in formData,
          bypassing @base-ui/react Select's internal form-field sync issues */}
      <input type="hidden" name="software_id" value={selectedSoftwareId} />

      <div className="space-y-2">
        <Label>Программа *</Label>
        {software.length === 0 ? (
          <div className="text-sm text-muted-foreground border border-input rounded-lg px-3 py-2 bg-muted/30">
            Справочник ПО пуст.{" "}
            <Link href="/licenses/software/new" className="text-primary underline hover:no-underline">
              Добавить ПО →
            </Link>
          </div>
        ) : (
          <Select value={selectedSoftwareId} onValueChange={(v) => setSelectedSoftwareId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите ПО" />
            </SelectTrigger>
            <SelectContent>
              {software.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}{s.version ? ` v${s.version}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
      <Button type="submit" disabled={!canSubmit}>{pending ? "Сохранение…" : "Добавить пул"}</Button>
    </form>
  );
}
