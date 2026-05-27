export const dynamic = 'force-dynamic';
export const revalidate = 0;

import ComputerForm from "@/components/computers/ComputerForm";
import PageHeader from "@/components/layout/PageHeader";
import { createComputer } from "@/lib/actions/computers";
import { createServiceClient } from "@/lib/supabase/server";

export default async function NewComputerPage() {
  const supabase = createServiceClient();
  const { data: templates } = await supabase
    .from("computer_templates")
    .select("*")
    .order("name");

  return (
    <div className="space-y-6">
      <PageHeader title="Добавить компьютер" />
      <ComputerForm action={createComputer} templates={templates ?? []} />
    </div>
  );
}
