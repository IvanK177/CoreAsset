export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import TemplateForm from "@/components/templates/TemplateForm";
import PageHeader from "@/components/layout/PageHeader";
import { updateTemplate } from "@/lib/actions/computer_templates";
import type { ComputerTemplateRow } from "@/lib/schemas/computer_template.schema";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: template } = await supabase.from("computer_templates").select("*").eq("id", id).single();
  
  if (!template) notFound();

  // Cast template to ComputerTemplateRow if needed, or rely on loose matching.
  const action = updateTemplate.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader title="Редактировать шаблон" />
      <TemplateForm template={template as ComputerTemplateRow} action={action} />
    </div>
  );
}
