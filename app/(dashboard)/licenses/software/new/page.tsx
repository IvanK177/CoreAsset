"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSoftware } from "@/lib/actions/licenses";

const initialState = { error: "" };

export default function NewSoftwarePage() {
  const [state, formAction, pending] = useActionState(
    async (_: typeof initialState, formData: FormData) => {
      const result = await createSoftware(formData);
      return (result as typeof initialState) ?? initialState;
    },
    initialState
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Добавить ПО</h1>
      <form action={formAction} className="space-y-5 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="name">Название *</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="version">Версия</Label>
            <Input id="version" name="version" placeholder="1.0.0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendor">Вендор</Label>
            <Input id="vendor" name="vendor" placeholder="Microsoft" />
          </div>
        </div>
        {state.error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{state.error}</p>
        )}
        <Button type="submit" disabled={pending}>{pending ? "Сохранение…" : "Добавить"}</Button>
      </form>
    </div>
  );
}
