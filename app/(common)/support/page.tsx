"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown, LifeBuoy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { sendSupportRequest } from "@/lib/actions/support";
import { toast } from "sonner";

/* ── FAQ Component ── */
function AccordionItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-150 dark:border-slate-800 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex justify-between items-center w-full py-4 text-left font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none cursor-pointer"
      >
        <span className="text-sm sm:text-base font-semibold leading-snug">{title}</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 sm:w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ml-4",
            open && "rotate-180 text-blue-500"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out opacity-0",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="text-xs sm:text-sm text-gray-650 dark:text-slate-400 leading-relaxed pt-1 pb-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Пожалуйста, введите текст сообщения");
      return;
    }

    setPending(true);
    try {
      const result = await sendSupportRequest(message);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Обращение успешно отправлено разработчикам!");
      setMessage("");
    } catch (err) {
      console.error(err);
      toast.error("Не удалось отправить обращение. Попробуйте еще раз.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto py-2 sm:py-6">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
          <LifeBuoy className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-905 dark:text-white">
            Поддержка и справка
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Ответы на частые вопросы и связь с разработчиками портала.
          </p>
        </div>
      </div>

      {/* Block 1: FAQ Accordion */}
      <div className="rounded-2xl border border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-slate-800/80 pb-3">
          <HelpCircle className="w-5 h-5 text-blue-500" />
          Часто задаваемые вопросы (FAQ)
        </h2>

        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          <AccordionItem title="В чем разница между заявками в IT и в АХО?">
            Если проблема связана с техникой (компьютеры, мониторы, сеть) — выбирайте IT-инцидент. 
            Если сломалась мебель, перегорела лампа или нужен ремонт кабинета — создавайте заявку для АХО.
          </AccordionItem>

          <AccordionItem title="Как быстро решат мою проблему?">
            Сроки решения зависят от приоритета: 
            Критические — 1 рабочий день, Высокий — до 2 дней, Средний — до 4 дней, Низкий — до 7 дней.
          </AccordionItem>

          <AccordionItem title="Что делать, если в списке моих устройств нет нужного?">
            Оборудование закрепляется администратором. 
            Создайте обычную IT-заявку, опишите проблему и укажите, что устройство не числится за вами.
          </AccordionItem>

          <AccordionItem title="Как узнать статус моей заявки?">
            Все ваши заявки отображаются на главной странице портала. 
            Статус меняется в режиме реального времени.
          </AccordionItem>
        </div>
      </div>

      {/* Block 2: Feedback Form */}
      <div className="rounded-2xl border border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5 sm:p-6 shadow-sm">
        <div className="space-y-1 mb-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            Нашли ошибку на портале или есть предложение?
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
            Опишите проблему или вашу идею. Наша команда разработчиков получит ваше обращение и изучит его.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message" className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Текст обращения
            </Label>
            <Textarea
              id="message"
              placeholder="Например: В разделе устройств некорректно отображается серийный номер у принтера..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              required
              disabled={pending}
              className="rounded-xl border-gray-200 focus:border-blue-500 dark:bg-slate-950 dark:border-slate-800"
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={pending}
              className="w-full sm:w-auto h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 cursor-pointer transition-colors"
            >
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              {pending ? "Отправка..." : "Отправить обращение"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
