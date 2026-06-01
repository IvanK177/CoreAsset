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

interface EmployeeProfileData {
  id: string;
  full_name: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  telegram: string | null;
  room: string | null;
  building: string | null;
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

  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("ФИО обязательно для заполнения");
      return;
    }

    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("full_name", fullName.trim());
    formData.set("email", email.trim());
    formData.set("position", position.trim());
    formData.set("phone", phone.trim());
    formData.set("telegram", telegram.trim());
    formData.set("room", room.trim());
    formData.set("building", building);

    const result = await updateEmployeeProfile(employee.id, formData);

    if (result.error) {
      toast.error("Ошибка при обновлении профиля: " + result.error);
      setError(result.error);
      setPending(false);
      return;
    }

    await clearCache("/portal");
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
      setError(null);
      onOpenChange(false);
    }
  };

  // Convert BUILDING_ADDRESSES to building items map for select component compatibility if it accepts items
  const buildingItems = Object.fromEntries(
    Object.keys(BUILDING_ADDRESSES).map((b) => [b, b])
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto bg-white rounded-2xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Личный профиль</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Обновите ваши контактные данные и информацию о рабочем месте
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="h-11 rounded-lg border-gray-200"
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
              className="h-11 rounded-lg border-gray-200"
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
              className="h-11 rounded-lg border-gray-200"
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
              className="h-11 rounded-lg border-gray-200"
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
              className="h-11 rounded-lg border-gray-200"
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
              <SelectTrigger className="h-11 rounded-lg border-gray-200 w-full bg-white text-left">
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
              className="h-11 rounded-lg border-gray-200"
              disabled={pending}
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
              {pending ? "Сохранение…" : "Сохранить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
