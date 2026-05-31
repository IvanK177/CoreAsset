export const dynamic = 'force-dynamic';
export const revalidate = 0;

import DeviceForm from "@/components/devices/DeviceForm";
import PageHeader from "@/components/layout/PageHeader";
import { createDevice } from "@/lib/actions/devices";
import { createServiceClient } from "@/lib/supabase/server";

export default async function NewDevicePage() {
  const supabase = createServiceClient();
  const { data: templates } = await supabase
    .from("computer_templates")
    .select("*")
    .order("name");

  return (
    <div className="space-y-6">
      <PageHeader title="Добавить устройство" />
      <DeviceForm action={createDevice} templates={templates ?? []} />
    </div>
  );
}
