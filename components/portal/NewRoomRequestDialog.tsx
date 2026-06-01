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
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

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
    formData.set("room", room.trim());
    formData.set("type", type);
    formData.set("description", description.trim());
    formData.set("author_id", employeeId);
    formData.set("photo_urls", JSON.stringify(photoUrls));

    const result = await createPortalRoomRequest(formData);

    if (result.error) {
      toast.error("Ошибка при отправке заявки: " + result.error);
      setError(result.error);
      setPending(false);
      return;
    }

    await clearCache("/portal");
    await clearCache("/incidents");
    toast.success("Заявка в АХЧ успешно отправлена");
    setRoom(defaultRoom);
    setDescription("");
    setType("ремонт");
    photoPreviews.forEach((p) => URL.revokeObjectURL(p));
    setPhotos([]);
    setPhotoPreviews([]);
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
      photoPreviews.forEach((p) => URL.revokeObjectURL(p));
      setPhotos([]);
      setPhotoPreviews([]);
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto bg-white rounded-2xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Заявка в АХЧ</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Создайте заявку на ремонт или оснащение кабинета
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cabinet */}
          <div className="space-y-2">
            <Label htmlFor="ahch-room" className="text-sm font-medium">
              Кабинет *
            </Label>
            <Input
              id="ahch-room"
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
            <Label htmlFor="ahch-description" className="text-sm font-medium">
              Что требуется сделать? *
            </Label>
            <Textarea
              id="ahch-description"
              placeholder="Подробно опишите вашу проблему или запрос (например: перегорела лампа, скрипит дверь, нужен дополнительный стул)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="rounded-lg border-gray-200 resize-none"
              required
            />
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
              {pending ? "Отправка…" : "+ Отправить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
