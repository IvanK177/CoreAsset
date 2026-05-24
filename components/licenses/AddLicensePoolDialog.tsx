"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createLicensePoolDialog } from "@/lib/actions/licenses";
import { clearCache } from "@/lib/actions/revalidate";
import { useRouter } from "next/navigation";

const licensePoolDialogSchema = z.object({
  software_name: z.string().min(1, "Обязательное поле"),
  vendor: z.string().min(1, "Обязательное поле"),
  license_type: z.enum(["perpetual", "subscription"]),
  price_per_unit: z.string().min(1, "Обязательное поле"),
  payment_period: z.enum(["monthly", "yearly", "one_time"]),
  total_seats: z.string().min(1, "Обязательное поле"),
  expires_at: z.string().optional().or(z.literal("")),
});

type LicensePoolDialogValues = z.infer<typeof licensePoolDialogSchema>;

const LICENSE_TYPE_ITEMS: Record<string, React.ReactNode> = {
  subscription: "Подписка",
  perpetual: "Бессрочная",
};

const PAYMENT_PERIOD_ITEMS: Record<string, React.ReactNode> = {
  monthly: "Ежемесячно",
  yearly: "Ежегодно",
  one_time: "Разово",
};

interface AddLicensePoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddLicensePoolDialog({ open, onOpenChange }: AddLicensePoolDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<LicensePoolDialogValues>({
    resolver: zodResolver(licensePoolDialogSchema),
    defaultValues: {
      software_name: "",
      vendor: "",
      license_type: "subscription",
      price_per_unit: "",
      payment_period: "monthly",
      total_seats: "",
      expires_at: "",
    },
  });

  const onSubmit = async (data: LicensePoolDialogValues) => {
    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("software_name", data.software_name);
    formData.set("vendor", data.vendor);
    formData.set("license_type", data.license_type);
    formData.set("price_per_unit", data.price_per_unit);
    formData.set("payment_period", data.payment_period);
    formData.set("total_seats", data.total_seats);
    if (data.expires_at) formData.set("expires_at", data.expires_at);

    const result = await createLicensePoolDialog(formData);
    if (result.error) {
      if (result.code === "23505") {
        toast.error("Пул лицензий с таким названием уже существует");
        form.setError("software_name", { message: "Программа с таким названием уже зарегистрирована" });
      } else {
        toast.error("Ошибка при сохранении: " + result.error);
        setError(result.error);
      }
      setPending(false);
      return;
    }

    await clearCache('/licenses');
    await clearCache('/dashboard');
    toast.success("Пул лицензий успешно добавлен");
    form.reset();
    onOpenChange(false);
    startTransition(() => { router.refresh(); });
    setPending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] bg-white rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Добавить пул лицензий</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Заполните данные для создания нового пула лицензий
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Software name — full width */}
          <div className="space-y-2">
            <Label htmlFor="software_name">Название программы *</Label>
            <Input
              id="software_name"
              placeholder="Microsoft Office 365"
              {...form.register("software_name")}
            />
            {form.formState.errors.software_name && (
              <p className="text-xs text-destructive">{form.formState.errors.software_name.message}</p>
            )}
          </div>

          {/* Other fields — 2 columns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor">Вендор *</Label>
              <Input
                id="vendor"
                placeholder="Microsoft"
                {...form.register("vendor")}
              />
              {form.formState.errors.vendor && (
                <p className="text-xs text-destructive">{form.formState.errors.vendor.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Тип лицензии</Label>
              <Select
                value={form.watch("license_type")}
                onValueChange={(v) => form.setValue("license_type", v as "perpetual" | "subscription")}
                items={LICENSE_TYPE_ITEMS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscription">Подписка</SelectItem>
                  <SelectItem value="perpetual">Бессрочная</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_per_unit">Стоимость *</Label>
              <Input
                id="price_per_unit"
                type="number"
                placeholder="1200"
                {...form.register("price_per_unit")}
              />
              {form.formState.errors.price_per_unit && (
                <p className="text-xs text-destructive">{form.formState.errors.price_per_unit.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Период оплаты</Label>
              <Select
                value={form.watch("payment_period")}
                onValueChange={(v) => form.setValue("payment_period", v as "monthly" | "yearly" | "one_time")}
                items={PAYMENT_PERIOD_ITEMS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Ежемесячно</SelectItem>
                  <SelectItem value="yearly">Ежегодно</SelectItem>
                  <SelectItem value="one_time">Разово</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_seats">Кол-во мест *</Label>
              <Input
                id="total_seats"
                type="number"
                placeholder="20"
                {...form.register("total_seats")}
              />
              {form.formState.errors.total_seats && (
                <p className="text-xs text-destructive">{form.formState.errors.total_seats.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires_at">Дата окончания</Label>
              <Input
                id="expires_at"
                type="date"
                placeholder="ДД.ММ.ГГГГ"
                {...form.register("expires_at")}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { onOpenChange(false); form.reset(); }}
              disabled={pending}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
            >
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              {pending ? "Создание…" : "Создать пул"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}