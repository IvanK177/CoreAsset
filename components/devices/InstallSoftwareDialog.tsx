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
import { installMultipleSoftware } from "@/lib/actions/licenses";
import { clearCache } from "@/lib/actions/revalidate";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const installSoftwareSchema = z.object({
  installed_at: z.string().min(1, "Укажите дату"),
});

type InstallSoftwareValues = z.infer<typeof installSoftwareSchema>;

interface LicenseOption {
  id: string;
  software_name: string;
  used_seats: number;
  total_seats: number;
}

interface InstallSoftwareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId: string;
  licenseOptions: LicenseOption[];
}

export function InstallSoftwareDialog({
  open,
  onOpenChange,
  deviceId,
  licenseOptions,
}: InstallSoftwareDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLicenseIds, setSelectedLicenseIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<InstallSoftwareValues>({
    resolver: zodResolver(installSoftwareSchema),
    defaultValues: {
      installed_at: today,
    },
  });

  const onSubmit = async (data: InstallSoftwareValues) => {
    if (selectedLicenseIds.length === 0) {
      setError("Выберите хотя бы одну лицензию");
      return;
    }

    setPending(true);
    setError(null);

    const result = await installMultipleSoftware(deviceId, selectedLicenseIds, data.installed_at);
    if (result.error) {
      if (result.code === "23505") {
        toast.error("ПО уже установлено на это устройство");
      } else {
        toast.error("Ошибка при установке ПО: " + result.error);
      }
      setError(result.error);
      setPending(false);
      return;
    }

    await clearCache(`/devices/${deviceId}`);
    await clearCache('/licenses');
    await clearCache('/dashboard');
    toast.success("ПО успешно установлено");
    setSelectedLicenseIds([]);
    form.reset({ installed_at: today });
    onOpenChange(false);
    startTransition(() => { router.refresh(); });
    setPending(false);
  };

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setSelectedLicenseIds([]);
      setError(null);
      form.reset({ installed_at: today });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Установить ПО</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Выберите лицензию для установки на это устройство
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Программы / Лицензии *</Label>
            <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto p-3 space-y-2 bg-gray-50">
              {licenseOptions.map((l) => {
                const isSelected = selectedLicenseIds.includes(l.id);
                const isFull = l.used_seats >= l.total_seats;
                return (
                  <label
                    key={l.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border text-sm bg-white",
                      isSelected ? "border-blue-200 bg-blue-50/50" : "border-transparent hover:bg-gray-50",
                      isFull && !isSelected && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isFull && !isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLicenseIds([...selectedLicenseIds, l.id]);
                        } else {
                          setSelectedLicenseIds(selectedLicenseIds.filter((id) => id !== l.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{l.software_name}</p>
                      <p className="text-xs text-gray-500">
                        {l.used_seats} из {l.total_seats} мест занято
                      </p>
                    </div>
                  </label>
                );
              })}
              {licenseOptions.length === 0 && (
                <p className="text-sm text-gray-500 py-4 text-center">Нет доступных лицензий</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="installed_at">Дата установки</Label>
            <Input
              id="installed_at"
              type="date"
              {...form.register("installed_at")}
            />
            {form.formState.errors.installed_at && (
              <p className="text-xs text-destructive">{form.formState.errors.installed_at.message}</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { handleOpenChange(false); }}
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
              {pending ? "Установка…" : "Установить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}