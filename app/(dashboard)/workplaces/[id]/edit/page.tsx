import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import WorkplaceForm from "@/components/workplaces/WorkplaceForm";
import PageHeader from "@/components/layout/PageHeader";
import { updateWorkplace } from "@/lib/actions/workplaces";

export default async function EditWorkplacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: workplace }, { data: computers }, { data: employees }] = await Promise.all([
    supabase.from("workplaces").select("*").eq("id", id).single(),
    supabase.from("computers").select("id, inventory_number").order("inventory_number"),
    supabase.from("employees").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);

  if (!workplace) notFound();

  const action = updateWorkplace.bind(null, id);

  return (
    <div>
      <PageHeader title="Редактировать рабочее место" />
      <WorkplaceForm workplace={workplace} computers={computers ?? []} employees={employees ?? []} action={action} />
    </div>
  );
}
