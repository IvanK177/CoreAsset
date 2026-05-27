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
};

export default function TemplatesPageClient({ templates }: TemplatesPageClientProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Шаблоны сборок"
        description="Управление шаблонами конфигураций оборудования для быстрого создания ПК"
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
        <div className="rounded-2xl bg-white p-12 shadow-sm border border-gray-100 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mx-auto mb-4 text-[#2563eb]">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Нет созданных шаблонов</h3>
          <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
            Создайте шаблон, чтобы стандартизировать конфигурации компьютеров и быстро заполнять характеристики при добавлении ПК.
          </p>
          <Link href="/templates/new">
            <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white">Создать первый шаблон</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl) => {
            const hw = safeHardware(tpl.hardware);
            return (
              <div key={tpl.id} className="rounded-2xl bg-white p-5 border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{tpl.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{computerTypeLabels[tpl.computer_type ?? ""] ?? tpl.computer_type ?? "—"}</p>
                    </div>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                      Шаблон
                    </Badge>
                  </div>

                  {tpl.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                      {tpl.description}
                    </p>
                  )}

                  {/* Hardware details grid */}
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-xl p-3 mb-4 text-xs text-gray-600">
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
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <Link href={`/templates/${tpl.id}/edit`}>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 gap-1.5 h-9 rounded-lg">
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
                        await clearCache("/computers");
                        startTransition(() => { router.refresh(); });
                      }
                    }}
                    description="Этот шаблон сборки будет удален безвозвратно. Привязанные компьютеры сохранят свои характеристики."
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
