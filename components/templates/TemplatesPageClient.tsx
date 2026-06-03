"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Cpu, MemoryStick, HardDrive, Layout, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { deleteTemplateDialog } from "@/lib/actions/computer_templates";
import { clearCache } from "@/lib/actions/revalidate";
import { safeHardware } from "@/lib/utils";
import type { ComputerTemplateRow } from "@/lib/schemas/computer_template.schema";

interface TemplatesPageClientProps {
  templates: ComputerTemplateRow[];
}

const computerTypeLabels: Record<string, string> = {
  desktop: "PC / Десктоп",
  laptop: "Ноутбук",
  monoblock: "Моноблок",
  server: "Сервер",
  monitor: "Монитор",
  keyboard: "Клавиатура",
  mouse: "Мышь",
  printer: "Принтер",
  other: "Другая периферия",
};

export default function TemplatesPageClient({ templates }: TemplatesPageClientProps) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Шаблоны"
        description="Управление шаблонами конфигураций оборудования для быстрого создания устройств"
        actionNode={
          <Link href="/templates/new">
            <Button size="sm" className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white gap-2">
              <Plus className="w-4 h-4" />
              Новый шаблон
            </Button>
          </Link>
        }
      />

      {templates.length === 0 ? (
        <div className="rounded-2xl bg-card p-12 shadow-sm border border-border text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mx-auto mb-4 text-blue-500">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Нет созданных шаблонов</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            Создайте шаблон, чтобы стандартизировать конфигурации устройств и быстро заполнять характеристики при добавлении оборудования.
          </p>
          <Link href="/templates/new">
            <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white">Создать первый шаблон</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl) => {
            const hw = safeHardware(tpl.hardware);
            const isComputer = ["desktop", "laptop", "monoblock", "server"].includes(tpl.computer_type ?? "");
            const isMonitor = tpl.computer_type === "monitor";

            return (
              <div key={tpl.id} className="rounded-2xl bg-card p-5 border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-bold text-foreground text-base">{tpl.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {tpl.computer_type === "desktop" ? (
                          <>
                            <span className="hidden sm:inline">PC / </span>Десктоп
                          </>
                        ) : (
                          computerTypeLabels[tpl.computer_type ?? ""] ?? tpl.computer_type ?? "—"
                        )}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border border-blue-500/20 font-medium">
                      Шаблон
                    </Badge>
                  </div>

                  {tpl.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {tpl.description}
                    </p>
                  )}

                  {/* Hardware details grid */}
                  {isComputer && (
                    <div className="grid grid-cols-2 gap-2 bg-muted/40 rounded-xl p-3 mb-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate" title={hw.cpu}>{hw.cpu || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MemoryStick className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate" title={hw.ram}>{hw.ram || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate" title={hw.storage}>{hw.storage || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layout className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate" title={hw.gpu}>{hw.gpu || "—"}</span>
                      </div>
                    </div>
                  )}

                  {isMonitor && (
                    <div className="grid grid-cols-2 gap-2 bg-muted/40 rounded-xl p-3 mb-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-400 shrink-0">Диагональ:</span>
                        <span className="truncate" title={hw.diagonal}>{hw.diagonal || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-400 shrink-0">Разрешение:</span>
                        <span className="truncate" title={hw.resolution}>{hw.resolution || "—"}</span>
                      </div>
                    </div>
                  )}

                  {!isComputer && !isMonitor && (
                    <div className="bg-muted/40 rounded-xl p-3 mb-4 text-xs text-muted-foreground italic text-center">
                      Простой шаблон без спецификаций железа
                    </div>
                  )}
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Link href={`/templates/${tpl.id}/edit`}>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5 h-9 rounded-lg">
                      <Edit className="w-4 h-4" />
                      Изменить
                    </Button>
                  </Link>
                  <DeleteConfirmDialog
                    onConfirm={async () => {
                      const res = await deleteTemplateDialog(tpl.id);
                      if (res?.error) {
                        alert("Ошибка при удалении: " + res.error);
                      } else {
                        await clearCache("/templates");
                        await clearCache("/devices");
                        startTransition(() => { router.refresh(); });
                      }
                    }}
                    description="Этот шаблон сборки будет удален безвозвратно. Привязанные устройства сохранят свои характеристики."
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
