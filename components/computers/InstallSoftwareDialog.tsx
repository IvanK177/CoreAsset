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
import { installSoftwareDialog } from "@/lib/actions/licenses";
import { clearCache } from "@/lib/actions/revalidate";
import { useRouter } from "next/navigation";

const installSoftwareSchema = z.object({
  license_pool_id: z.string().min(1, "Выберите программу"),
  installed_at: z.string().min(1, "Укажите дату"),
});

type InstallSoftwareValues = z.infer<typeof installSoftwareSchema>;

interface LicensePoolOption {
  id: string;
  software_name: string;
  used_seats: number;
  total_seats: number;
}

interface InstallSoftwareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  computerId: string;
  licensePools: LicensePoolOption[];
}

export function InstallSoftwareDialog({
  open,
  onOpenChange,
  computerId,
  licensePools,
}: InstallSoftwareDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<InstallSoftwareValues>({
    resolver: zodResolver(installSoftwareSchema),
    defaultValues: {
      license_pool_id: "",
      installed_at: today,
    },
  });

  const onSubmit = async (data: InstallSoftwareValues) => {
    setPending(true);
    setError(null);

    const result = await installSoftwareDialog(computerId, data.license_pool_id, data.installed_at);
    if (result.error) {
      if (result.code === "23505") {
        toast.error("ПО уже установлено на этот компьютер");
      } else {
        toast.error("Ошибка при установке ПО: " + result.error);
      }
      setError(result.error);
      setPending(false);
      return;
    }

    await clearCache(`/computers/${computerId}`);
    await clearCache('/licenses');
    await clearCache('/dashboard');
    toast.success("ПО успешно установлено");
    form.reset({ license_pool_id: "", installed_at: today });
    onOpenChange(false);
    startTransition(() => { router.refresh(); });
    setPending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Установить ПО</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Выберите программу из пула лицензий для установки на этот компьютер
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Программа *</Label>
            <Select
              value={form.watch("license_pool_id")}
              onValueChange={(v) => form.setValue("license_pool_id", v ?? "")}
              items={Object.fromEntries(licensePools.map((pool) => [pool.id, `${pool.software_name} (${pool.used_seats}/${pool.total_seats} использовано)`]))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите из пула..." />
              </SelectTrigger>
              <SelectContent>
                {licensePools.map((pool) => (
                  <SelectItem key={pool.id} value={pool.id}>
                    {pool.software_name} ({pool.used_seats}/{pool.total_seats} использовано)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.license_pool_id && (
              <p className="text-xs text-destructive">{form.formState.errors.license_pool_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="installed_at">Дата начала подписки</Label>
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
              onClick={() => { onOpenChange(false); form.reset({ license_pool_id: "", installed_at: today }); }}
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