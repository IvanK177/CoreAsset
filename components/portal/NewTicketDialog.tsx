"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, Image as ImageIcon, X } from "lucide-react";
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

interface DeviceOption {
  id: string;
  inventory_number: string;
  computer_type: string | null; // DB column name used as Subtype/Model name
  device_type: string;
}

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  devices: DeviceOption[];
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

const deviceTypeRussianLabels: Record<string, string> = {
  pc: "Компьютер",
  monitor: "Монитор",
  keyboard: "Клавиатура",
  mouse: "Мышь",
  printer: "Принтер",
  other: "Устройство",
};



export function NewTicketDialog({
  open,
  onOpenChange,
  employeeId,
  devices,
}: NewTicketDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("medium");
  const [pending, setPending] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const router = useRouter();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...selectedFiles]);
      const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
      setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Укажите, что сломалось");
      return;
    }

    setPending(true);
    setError(null);

    const photoUrls: string[] = [];
    try {
      if (photos.length > 0) {
        const { compressImageToTarget } = await import("@/lib/image/compressImage");
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        for (const file of photos) {
          let fileToUpload = file;
          try {
            const compressionResult = await compressImageToTarget(file);
            fileToUpload = compressionResult.file;
            console.log(`Original: ${Math.round(file.size / 1024)}KB, Compressed: ${compressionResult.finalSizeKB}KB`);
          } catch (compressErr) {
            console.warn("Compression failed, using original file:", compressErr);
          }

          const fileExt = fileToUpload.name.split(".").pop();
          const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto 
            ? crypto.randomUUID() 
            : `${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
          const fileName = `${uuid}.${fileExt}`;
          const filePath = `${employeeId}/${fileName}`;
          const { error: uploadError } = await supabase.storage
            .from("ticket-attachments")
            .upload(filePath, fileToUpload, {
              contentType: fileToUpload.type,
              upsert: false,
            });

          if (uploadError) {
            console.error("Photo upload error:", uploadError);
            toast.error(`Ошибка при загрузке фото ${file.name}`);
            setPending(false);
            return;
          }

          const { data: { publicUrl } } = supabase.storage
            .from("ticket-attachments")
            .getPublicUrl(filePath);

          photoUrls.push(publicUrl);
        }
      }
    } catch (err) {
      console.error("Attachment upload exception:", err);
      toast.error("Не удалось загрузить фотографии");
      setPending(false);
      return;
    }

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("description", description.trim());
    formData.set("device_id", deviceId);
    formData.set("employee_id", employeeId);
    formData.set("priority", priority);
    formData.set("photo_urls", JSON.stringify(photoUrls));

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
    setDeviceId("");
    setPriority("medium");
    photoPreviews.forEach((p) => URL.revokeObjectURL(p));
    setPhotos([]);
    setPhotoPreviews([]);
    setPending(false);
    onOpenChange(false);
    startTransition(() => { router.refresh(); });
  };

  const handleClose = () => {
    if (!pending) {
      setTitle("");
      setDescription("");
      setDeviceId("");
      setPriority("medium");
      photoPreviews.forEach((p) => URL.revokeObjectURL(p));
      setPhotos([]);
      setPhotoPreviews([]);
      setError(null);
      onOpenChange(false);
    }
  };

  // Build items map for Select with format: [Тип] Название (Инв. номер)
  const deviceItems = Object.fromEntries(
    devices.map((d) => {
      const typeLabel = deviceTypeRussianLabels[d.device_type] || "Устройство";
      const modelLabel = d.computer_type || "—";
      return [
        d.id,
        `[${typeLabel}] ${modelLabel} (${d.inventory_number})`,
      ];
    })
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto bg-white rounded-2xl p-5 sm:p-6">
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



          {/* Device select */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              С каким устройством проблема?
            </Label>
            <Select
              value={deviceId}
              onValueChange={(v) => setDeviceId(v ?? "")}
              items={deviceItems}
            >
              <SelectTrigger className="h-11 rounded-lg border-gray-200 w-full">
                <SelectValue placeholder={devices.length > 0 ? "Выберите устройство" : "Нет доступных устройств"} />
              </SelectTrigger>
              <SelectContent>
                {devices.length === 0 ? (
                  <SelectItem value="" disabled>Нет доступных устройств</SelectItem>
                ) : (
                  devices.map((d) => {
                    const typeLabel = deviceTypeRussianLabels[d.device_type] || "Устройство";
                    const modelLabel = d.computer_type || "—";
                    return (
                      <SelectItem key={d.id} value={d.id}>
                        {`[${typeLabel}] ${modelLabel} (${d.inventory_number})`}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Priority toggle group */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Срочность</Label>
            <div className="grid grid-cols-2 xs:grid-cols-4 gap-2">
              {priorityOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={cn(
                    "h-9 rounded-lg text-xs xs:text-sm font-medium transition-all duration-150 border w-full",
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

          {/* Attach Photos */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-gray-500" />
              Прикрепить фото
            </Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-center border border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  disabled={pending}
                />
                <div className="text-center space-y-1">
                  <ImageIcon className="w-6 h-6 text-gray-400 mx-auto" />
                  <span className="text-xs text-gray-500 block">Нажмите, чтобы выбрать изображения</span>
                </div>
              </label>

              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-lg border overflow-hidden group">
                      <img src={preview} alt="Превью" className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-black/90 text-white rounded-full p-1 cursor-pointer transition-colors"
                        title="Удалить"
                        disabled={pending}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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