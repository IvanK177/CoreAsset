"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { LifeBuoy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { sendTelegramSupportMessage } from "@/lib/actions/telegram-support";
import { toast } from "sonner";

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  // Hide the support button on auth and onboarding pages
  const isAuthPage =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/onboarding") ||
    pathname === "/";

  if (isAuthPage) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Пожалуйста, введите текст сообщения");
      return;
    }

    setPending(true);
    setError(null);

    const result = await sendTelegramSupportMessage(message);

    if (result.error) {
      toast.error(result.error);
      setError(result.error);
      setPending(false);
      return;
    }

    toast.success("Обращение успешно отправлено в поддержку!");
    setMessage("");
    setPending(false);
    setOpen(false);
  };

  const handleClose = () => {
    if (!pending) {
      setMessage("");
      setError(null);
      setOpen(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 group cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-300"
        title="Связаться с поддержкой"
      >
        <LifeBuoy className="w-6 h-6 animate-pulse group-hover:rotate-45 transition-transform duration-500" />
      </button>

      {/* Support Dialog */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-blue-600" />
              Служба поддержки
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Опишите возникшую проблему. Мы получим ваше сообщение в Telegram и ответим в ближайшее время.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="support-message" className="text-sm font-medium">
                Описание проблемы *
              </Label>
              <Textarea
                id="support-message"
                placeholder="Например: Не могу подключить принтер в 204 кабинете, выдает ошибку..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="rounded-lg border-gray-200 resize-none"
                required
                disabled={pending}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

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
                className="flex-1 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium gap-2 cursor-pointer"
              >
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                {pending ? "Отправка…" : "Отправить"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
