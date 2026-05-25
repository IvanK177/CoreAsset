"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createLicense } from "@/lib/actions/licenses";

const LICENSE_TYPE_ITEMS: Record<string, React.ReactNode> = {
  perpetual: "Бессрочная",
  subscription: "Подписка",
};

const initialState = { error: "" };

export default function NewLicenseClient() {
  const [state, formAction, pending] = useActionState(
    async (_: typeof initialState, formData: FormData) => {
      const result = await createLicense(formData);
      return (result as typeof initialState) ?? initialState;
    },
    initialState
  );

  return (
    <form action={formAction} className="space-y-5 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="software_name">Название программы *</Label>
        <Input id="software_name" name="software_name" required placeholder="Microsoft Office 365" />
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Тип *</Label>
          <Select name="license_type" defaultValue="perpetual" items={LICENSE_TYPE_ITEMS}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="perpetual">Бессрочная</SelectItem>
              <SelectItem value="subscription">Подписка</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="license_key">Ключ лицензии</Label>
          <Input id="license_key" name="license_key" placeholder="XXXXX-XXXXX-XXXXX" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="total_seats">Кол-во мест *</Label>
          <Input id="total_seats" name="total_seats" type="number" min="1" placeholder="1" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price_per_unit">Стоимость за ед. (₽)</Label>
          <Input id="price_per_unit" name="price_per_unit" type="number" min="0" step="0.01" placeholder="0" />
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
      <Button type="submit" disabled={pending} className="gap-2">
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        {pending ? "Сохранение…" : "Добавить лицензию"}
      </Button>
    </form>
  );
}