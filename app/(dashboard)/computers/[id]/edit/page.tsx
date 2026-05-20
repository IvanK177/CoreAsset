import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ComputerForm from "@/components/computers/ComputerForm";
import PageHeader from "@/components/layout/PageHeader";
import { updateComputer } from "@/lib/actions/computers";

export default async function EditComputerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: computer } = await supabase.from("computers").select("*").eq("id", id).single();
  if (!computer) notFound();

  const action = updateComputer.bind(null, id);

  return (
    <div>
      <PageHeader title="Редактировать компьютер" />
      <ComputerForm computer={computer} action={action} />
    </div>
  );
}
