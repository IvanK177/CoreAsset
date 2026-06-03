"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateEmployeeProfile } from "@/lib/actions/portal";
import { clearCache } from "@/lib/actions/revalidate";
import { useRouter } from "next/navigation";
import { BUILDING_ADDRESSES } from "@/lib/utils";

export interface EmployeeProfileData {
  id: string;
  full_name: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  telegram: string | null;
  room: string | null;
  building: string | null;
  avatar_url?: string | null;
}

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeProfileData;
}

export function ProfileDialog({
  open,
  onOpenChange,
  employee,
}: ProfileDialogProps) {
  const [fullName, setFullName] = useState(employee.full_name);
  const [email, setEmail] = useState(employee.email ?? "");
  const [position, setPosition] = useState(employee.position ?? "");
  const [phone, setPhone] = useState(employee.phone ?? "");
  const [telegram, setTelegram] = useState(employee.telegram ?? "");
  const [room, setRoom] = useState(employee.room ?? "");
  const [building, setBuilding] = useState(employee.building ?? "");

  const [avatarUrl, setAvatarUrl] = useState(employee.avatar_url ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(employee.avatar_url ?? "");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      const preview = URL.createObjectURL(file);
      setAvatarPreview(preview);
    }
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAvatarFile(null);
    setAvatarPreview("");
    setAvatarUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("ФИО обязательно для заполнения");
      return;
    }

    setPending(true);
    setError(null);

    let uploadedAvatarUrl = avatarUrl;

    if (avatarFile) {
      try {
        const { compressImageToTarget } = await import("@/lib/image/compressImage");
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        
        let fileToUpload = avatarFile;
        try {
          const compressionResult = await compressImageToTarget(avatarFile, { targetKB: 50 });
          fileToUpload = compressionResult.file;
        } catch (compressErr) {
          console.warn("Compression failed, using original file:", compressErr);
        }

        const fileExt = fileToUpload.name.split(".").pop();
        const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto 
          ? crypto.randomUUID() 
          : `${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
        const fileName = `avatar_${uuid}.${fileExt}`;
        const filePath = `avatars/${employee.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from("ticket-attachments")
          .upload(filePath, fileToUpload, {
            contentType: fileToUpload.type,
            upsert: false,
          });

        if (uploadError) {
          console.error("Avatar upload error:", uploadError);
          toast.error("Ошибка при загрузке аватарки");
          setPending(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("ticket-attachments")
          .getPublicUrl(filePath);

        uploadedAvatarUrl = publicUrl;
      } catch (err) {
        console.error("Avatar upload exception:", err);
        toast.error("Не удалось сохранить аватарку");
        setPending(false);
        return;
      }
    }

    const formData = new FormData();
    formData.set("full_name", fullName.trim());
    formData.set("email", email.trim());
    formData.set("position", position.trim());
    formData.set("phone", phone.trim());
    formData.set("telegram", telegram.trim());
    formData.set("room", room.trim());
    formData.set("building", building);
    formData.set("avatar_url", uploadedAvatarUrl);

    const result = await updateEmployeeProfile(employee.id, formData);

    if (result.error) {
      toast.error("Ошибка при обновлении профиля: " + result.error);
      setError(result.error);
      setPending(false);
      return;
    }

    await clearCache("/portal");
    await clearCache("/it-portal");
    toast.success("Профиль успешно обновлен");
    setPending(false);
    onOpenChange(false);
    startTransition(() => {
      router.refresh();
    });
  };

  const handleClose = () => {
    if (!pending) {
      setFullName(employee.full_name);
      setEmail(employee.email ?? "");
      setPosition(employee.position ?? "");
      setPhone(employee.phone ?? "");
      setTelegram(employee.telegram ?? "");
      setRoom(employee.room ?? "");
      setBuilding(employee.building ?? "");
      setAvatarUrl(employee.avatar_url ?? "");
      setAvatarPreview(employee.avatar_url ?? "");
      setAvatarFile(null);
      setError(null);
      onOpenChange(false);
    }
  };

  const buildingItems = Object.fromEntries(
    Object.keys(BUILDING_ADDRESSES).map((b) => [b, b])
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto rounded-2xl p-5 sm:p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Личный профиль</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Обновите ваши контактные данные и информацию о рабочем месте
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload Section */}
          <div className="flex flex-col items-center justify-center pb-2">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-blue-500 transition-all duration-150 group overflow-hidden bg-muted/50"
              title="Нажмите, чтобы изменить аватарку"
            >
              {avatarPreview ? (
                <>
                  <img src={avatarPreview} alt="Аватарка" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </>
              ) : (
                <div className="text-center p-2 flex flex-col items-center justify-center">
                  <User className="w-7 h-7 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground mt-1">Добавить фото</span>
                </div>
              )}
            </div>
            
            {avatarPreview && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="mt-1.5 text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer"
                disabled={pending}
              >
                Удалить фото
              </button>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
              disabled={pending}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="profile-email" className="text-sm font-medium">
              Email (Логин) *
            </Label>
            <Input
              id="profile-email"
              type="email"
              placeholder="example@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-lg border-border bg-background"
              required
              disabled={pending}
            />
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="profile-position" className="text-sm font-medium">
              Должность *
            </Label>
            <Input
              id="profile-position"
              placeholder="Например: Разработчик"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="h-11 rounded-lg border-border bg-background"
              required
              disabled={pending}
            />
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="profile-fullname" className="text-sm font-medium">
              ФИО *
            </Label>
            <Input
              id="profile-fullname"
              placeholder="Иванов Иван Иванович"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 rounded-lg border-border bg-background"
              required
              disabled={pending}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="profile-phone" className="text-sm font-medium">
              Телефон
            </Label>
            <Input
              id="profile-phone"
              placeholder="+7 (999) 123-45-67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 rounded-lg border-border bg-background"
              disabled={pending}
            />
          </div>

          {/* Telegram */}
          <div className="space-y-2">
            <Label htmlFor="profile-telegram" className="text-sm font-medium">
              Telegram
            </Label>
            <Input
              id="profile-telegram"
              placeholder="@username"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              className="h-11 rounded-lg border-border bg-background"
              disabled={pending}
            />
          </div>

          {/* Building Select */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Корпус</Label>
            <Select
              value={building}
              onValueChange={(v) => setBuilding(v ?? "")}
              items={buildingItems}
            >
              <SelectTrigger className="h-11 rounded-lg border-border w-full bg-background text-left">
                <SelectValue placeholder="Выберите корпус" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(BUILDING_ADDRESSES).map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room */}
          <div className="space-y-2">
            <Label htmlFor="profile-room" className="text-sm font-medium">
              Кабинет
            </Label>
            <Input
              id="profile-room"
              placeholder="Например: 204"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="h-11 rounded-lg border-border bg-background"
              disabled={pending}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-500/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-10 rounded-lg border-border text-foreground hover:bg-muted"
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
              {pending ? "Сохранение…" : "Сохранить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
