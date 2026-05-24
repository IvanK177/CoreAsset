export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createServiceClient } from "@/lib/supabase/server";
import WorkplaceForm from "@/components/workplaces/WorkplaceForm";
import PageHeader from "@/components/layout/PageHeader";
import { createWorkplace } from "@/lib/actions/workplaces";

export default async function NewWorkplacePage() {
  const supabase = createServiceClient();
  const [{ data: computers }, { data: employees }] = await Promise.all([
    supabase.from("computers").select("id, inventory_number").eq("lifecycle_status", "active").order("inventory_number"),
    supabase.from("employees").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);

  return (
    <div>
      <PageHeader title="Создать рабочее место" />
      <WorkplaceForm
        computers={computers ?? []}
        employees={employees ?? []}
        action={createWorkplace}
      />
    </div>
  );
}
