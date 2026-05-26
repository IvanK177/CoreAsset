"use client";

import { useState, useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPortalIncident } from "@/lib/actions/portal";
import { clearCache } from "@/lib/actions/revalidate";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type PriorityLevel = "low" | "medium" | "high" | "critical";

interface ComputerOption {
  id: string;
  inventory_number: string;
  computer_type: string | null;
}

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  computers: ComputerOption[];
}

const priorityOptions: { value: PriorityLevel; label: string; activeClassName: string }[] = [
  {
    value: "low",
    label: "Не срочно",
    activeClassName: "border-gray-300 text-gray-600 bg-gray-50",
  },
  {
    value: "medium",
    label: "Обычная",
    activeClassName: "bg-blue-600 text-white border-blue-600",
  },
  {
    value: "high",
    label: "Срочно",
    activeClassName: "border-orange-400 text-orange-600 bg-orange-50",
  },
  {
    value: "critical",
    label: "Критично",
    activeClassName: "border-red-400 text-red-600 bg-red-50",
  },
];

const computerTypeLabels: Record<string, string> = {
  desktop: "PC",
  laptop: "Laptop",
  monoblock: "Monoblock",
  server: "Server",
};

export function NewTicketDialog({
  open,
  onOpenChange,
  employeeId,
  computers,
}: NewTicketDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [computerId, setComputerId] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("medium");
  const [pending, setPending] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Укажите, что сломалось");
      return;
    }

    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("description", description.trim());
    formData.set("computer_id", computerId);
    formData.set("employee_id", employeeId);
    formData.set("priority", priority);

    const result = await createPortalIncident(formData);

    if (result.error) {
      if (result.code === "23505") {
        toast.error("Запись с таким уникальным значением уже существует");
      } else {
        toast.error("Ошибка при отправке заявки: " + result.error);
      }
      setError(result.error);
      setPending(false);
      return;
    }

    await clearCache('/portal');
    await clearCache('/incidents');
    await clearCache('/dashboard');
    await clearCache('/it-portal');
    await clearCache('/it-portal/my-tasks');
    toast.success("Заявка успешно отправлена");
    setTitle("");
    setDescription("");
    setComputerId("");
    setPriority("medium");
    setPending(false);
    onOpenChange(false);
    startTransition(() => { router.refresh(); });
  };

  const handleClose = () => {
    if (!pending) {
      setTitle("");
      setDescription("");
      setComputerId("");
      setPriority("medium");
      setError(null);
      onOpenChange(false);
    }
  };

  // Build items map for Select
  const computerItems = Object.fromEntries(
    computers.map((c) => [
      c.id,
      `${c.inventory_number} (${computerTypeLabels[c.computer_type ?? ""] ?? c.computer_type ?? "—"})`,
    ])
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Новая заявка</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Создайте заявку — мы разберёмся с проблемой
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* What broke? */}
          <div className="space-y-2">
            <Label htmlFor="ticket-title" className="text-sm font-medium">
              Что сломалось? *
            </Label>
            <Input
              id="ticket-title"
              placeholder="Например: не работает интернет"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 rounded-lg border-gray-200"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="ticket-description" className="text-sm font-medium">
              Описание проблемы
            </Label>
            <Textarea
              id="ticket-description"
              placeholder="Расскажите подробнее: когда началось, что делали перед этим..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-lg border-gray-200 resize-none"
            />
          </div>

          {/* Computer select */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              С каким устройством проблема?
            </Label>
            <Select
              value={computerId}
              onValueChange={(v) => setComputerId(v ?? "")}
              items={computerItems}
            >
              <SelectTrigger className="h-11 rounded-lg border-gray-200 w-full">
                <SelectValue placeholder={computers.length > 0 ? "Выберите устройство" : "Нет доступных устройств"} />
              </SelectTrigger>
              <SelectContent>
                {computers.length === 0 ? (
                  <SelectItem value="" disabled>Нет доступных устройств</SelectItem>
                ) : (
                  computers.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.inventory_number} ({computerTypeLabels[comp.computer_type ?? ""] ?? comp.computer_type ?? "—"})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Priority toggle group */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Срочность</Label>
            <div className="flex gap-2">
              {priorityOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={cn(
                    "flex-1 h-9 rounded-lg text-sm font-medium transition-all duration-150 border",
                    priority === opt.value
                      ? opt.activeClassName
                      : "border-gray-200 text-gray-400 hover:bg-gray-50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-10 rounded-lg border-gray-200 text-gray-700"
              onClick={handleClose}
              disabled={pending}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="flex-1 h-10 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium gap-2"
            >
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              {pending ? "Отправка…" : "+ Отправить заявку"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}