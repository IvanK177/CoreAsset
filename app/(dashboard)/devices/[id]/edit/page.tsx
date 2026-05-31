export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import DeviceForm from "@/components/devices/DeviceForm";
import PageHeader from "@/components/layout/PageHeader";
import { updateDevice } from "@/lib/actions/devices";

export default async function EditDevicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  
  const [deviceRes, templatesRes] = await Promise.all([
    supabase.from("devices").select("*").eq("id", id).single(),
    supabase.from("computer_templates").select("*").order("name"),
  ]);

  if (!deviceRes.data) notFound();

  const action = updateDevice.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader title="Редактировать устройство" />
      <DeviceForm device={deviceRes.data} action={action} templates={templatesRes.data ?? []} />
    </div>
  );
}
