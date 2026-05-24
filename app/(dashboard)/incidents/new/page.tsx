export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createServiceClient } from "@/lib/supabase/server";
import PageHeader from "@/components/layout/PageHeader";
import NewIncidentClient from "./NewIncidentClient";

export default async function NewIncidentPage({
  searchParams,
}: {
  searchParams: Promise<{ computer_id?: string }>;
}) {
  const { computer_id } = await searchParams;
  const supabase = createServiceClient();
  const [{ data: computers }, { data: employees }] = await Promise.all([
    supabase
      .from("computers")
      .select("id, inventory_number")
      .order("inventory_number"),
    supabase
      .from("employees")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name"),
  ]);

  return (
    <div>
      <PageHeader title="Создать тикет" />
      <NewIncidentClient computers={computers ?? []} employees={employees ?? []} defaultComputerId={computer_id} />
    </div>
  );
}
