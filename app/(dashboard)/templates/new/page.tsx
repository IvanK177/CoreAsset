export const dynamic = 'force-dynamic';
export const revalidate = 0;

import TemplateForm from "@/components/templates/TemplateForm";
import PageHeader from "@/components/layout/PageHeader";
import { createTemplate } from "@/lib/actions/computer_templates";

export default function NewTemplatePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Создать новый шаблон" />
      <TemplateForm action={createTemplate} />
    </div>
  );
}
