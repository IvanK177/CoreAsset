import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/layout/PageHeader";
import NewIncidentClient from "./NewIncidentClient";

export default async function NewIncidentPage({
  searchParams,
}: {
  searchParams: Promise<{ computer_id?: string }>;
}) {
  const { computer_id } = await searchParams;
  const supabase = await createClient();
  const { data: computers } = await supabase
    .from("computers")
    .select("id, inventory_number")
    .order("inventory_number");

  return (
    <div>
      <PageHeader title="Создать тикет" />
      <NewIncidentClient computers={computers ?? []} defaultComputerId={computer_id} />
    </div>
  );
}
