export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createServiceClient } from "@/lib/supabase/server";
import PageHeader from "@/components/layout/PageHeader";
import NewIncidentClient from "./NewIncidentClient";

export default async function NewIncidentPage({
  searchParams,
}: {
  searchParams: Promise<{ device_id?: string }>;
}) {
  const { device_id } = await searchParams;
  const supabase = createServiceClient();
  const [{ data: devices }, { data: employees }] = await Promise.all([
    supabase
      .from("devices")
      .select("id, inventory_number, device_type, computer_type")
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
      <NewIncidentClient devices={devices ?? []} employees={employees ?? []} defaultDeviceId={device_id} />
    </div>
  );
}
