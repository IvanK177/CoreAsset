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
import { createLicenseDialog } from "@/lib/actions/licenses";
import { clearCache } from "@/lib/actions/revalidate";
import { useRouter } from "next/navigation";

const licenseDialogSchema = z.object({
  software_name: z.string().min(1, "Обязательное поле"),
  version: z.string().optional().or(z.literal("")),
  vendor: z.string().optional().or(z.literal("")),
  license_type: z.enum(["perpetual", "subscription"]),
  license_key: z.string().optional().or(z.literal("")),
  total_seats: z.number().int().min(1, "Минимум 1"),
  price_per_unit: z.number().min(0, "Минимум 0"),
  expires_at: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type LicenseDialogValues = z.infer<typeof licenseDialogSchema>;

const LICENSE_TYPE_ITEMS: Record<string, React.ReactNode> = {
  subscription: "Подписка",
  perpetual: "Бессрочная",
};

interface AddLicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddLicenseDialog({ open, onOpenChange }: AddLicenseDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<LicenseDialogValues>({
    resolver: zodResolver(licenseDialogSchema),
    defaultValues: {
      software_name: "",
      version: "",
      vendor: "",
      license_type: "subscription",
      license_key: "",
      total_seats: 1,
      price_per_unit: 0,
      expires_at: "",
      notes: "",
    },
  });

  const onSubmit = async (data: LicenseDialogValues) => {
    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("software_name", data.software_name);
    if (data.version) formData.set("version", data.version);
    if (data.vendor) formData.set("vendor", data.vendor);
    formData.set("license_type", data.license_type);
    if (data.license_key) formData.set("license_key", data.license_key);
    formData.set("total_seats", String(data.total_seats));
    formData.set("price_per_unit", String(data.price_per_unit));
    if (data.expires_at) formData.set("expires_at", data.expires_at);
    if (data.notes) formData.set("notes", data.notes);

    const result = await createLicenseDialog(formData);
    if (result.error) {
      if (result.code === "23505") {
        toast.error("Лицензия с таким названием уже существует");
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
    toast.success("Лицензия успешно добавлена");
    form.reset();
    onOpenChange(false);
    startTransition(() => { router.refresh(); });
    setPending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] bg-white rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Добавить лицензию</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Заполните данные для создания новой лицензии
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
              <Label htmlFor="version">Версия</Label>
              <Input
                id="version"
                placeholder="1.0.0"
                {...form.register("version")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">Вендор</Label>
              <Input
                id="vendor"
                placeholder="Microsoft"
                {...form.register("vendor")}
              />
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
              <Label htmlFor="license_key">Ключ лицензии</Label>
              <Input
                id="license_key"
                placeholder="XXXXX-XXXXX-XXXXX"
                {...form.register("license_key")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_seats">Кол-во мест *</Label>
              <Input
                id="total_seats"
                type="number"
                placeholder="20"
                {...form.register("total_seats", { valueAsNumber: true })}
              />
              {form.formState.errors.total_seats && (
                <p className="text-xs text-destructive">{form.formState.errors.total_seats.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_per_unit">Стоимость за ед. (₽)</Label>
              <Input
                id="price_per_unit"
                type="number"
                placeholder="1200"
                {...form.register("price_per_unit", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires_at">Дата окончания</Label>
              <Input
                id="expires_at"
                type="date"
                {...form.register("expires_at")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Примечание</Label>
              <Input
                id="notes"
                placeholder="Дополнительная информация"
                {...form.register("notes")}
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
              {pending ? "Создание…" : "Создать лицензию"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}