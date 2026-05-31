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
import { createPortalRoomRequest } from "@/lib/actions/portal";
import { clearCache } from "@/lib/actions/revalidate";
import { useRouter } from "next/navigation";

interface NewRoomRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  defaultRoom?: string;
}

export function NewRoomRequestDialog({
  open,
  onOpenChange,
  employeeId,
  defaultRoom = "",
}: NewRoomRequestDialogProps) {
  const [room, setRoom] = useState(defaultRoom);
  const [type, setType] = useState<"ремонт" | "оснащение">("ремонт");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room.trim()) {
      setError("Укажите кабинет");
      return;
    }
    if (!description.trim()) {
      setError("Опишите, что требуется сделать");
      return;
    }

    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("room", room.trim());
    formData.set("type", type);
    formData.set("description", description.trim());
    formData.set("author_id", employeeId);

    const result = await createPortalRoomRequest(formData);

    if (result.error) {
      toast.error("Ошибка при отправке заявки: " + result.error);
      setError(result.error);
      setPending(false);
      return;
    }

    await clearCache("/portal");
    await clearCache("/incidents");
    toast.success("Заявка в АХО успешно отправлена");
    setRoom(defaultRoom);
    setDescription("");
    setType("ремонт");
    setPending(false);
    onOpenChange(false);
    startTransition(() => {
      router.refresh();
    });
  };

  const handleClose = () => {
    if (!pending) {
      setRoom(defaultRoom);
      setDescription("");
      setType("ремонт");
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Заявка в АХО</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Создайте заявку на ремонт или оснащение кабинета
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cabinet */}
          <div className="space-y-2">
            <Label htmlFor="aho-room" className="text-sm font-medium">
              Кабинет *
            </Label>
            <Input
              id="aho-room"
              placeholder="Например: 204"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="h-11 rounded-lg border-gray-200"
              required
            />
          </div>

          {/* Request Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Тип заявки *</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as "ремонт" | "оснащение")}
              items={{
                ремонт: "Ремонт",
                оснащение: "Оснащение",
              }}
            >
              <SelectTrigger className="h-11 rounded-lg border-gray-200 w-full bg-white">
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ремонт">Ремонт</SelectItem>
                <SelectItem value="оснащение">Оснащение</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="aho-description" className="text-sm font-medium">
              Что требуется сделать? *
            </Label>
            <Textarea
              id="aho-description"
              placeholder="Подробно опишите вашу проблему или запрос (например: перегорела лампа, скрипит дверь, нужен дополнительный стул)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="rounded-lg border-gray-200 resize-none"
              required
            />
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
              {pending ? "Отправка…" : "+ Отправить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
