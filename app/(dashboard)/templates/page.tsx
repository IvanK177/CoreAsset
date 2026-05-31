export const dynamic = 'force-dynamic';
export const revalidate = 0;

import TemplatesPageClient from "@/components/templates/TemplatesPageClient";
import { getCachedTemplates } from "@/lib/supabase/cached";

export default async function TemplatesPage() {
  const templates = await getCachedTemplates();
  const normalizedTemplates = templates.map((tpl) => ({
    ...tpl,
    created_at: tpl.created_at || new Date().toISOString(),
  }));
  return <TemplatesPageClient templates={normalizedTemplates} />;
}
