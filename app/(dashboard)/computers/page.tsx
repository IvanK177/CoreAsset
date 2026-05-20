import { createClient } from "@/lib/supabase/server";
import ComputerTable from "@/components/computers/ComputerTable";
import PageHeader from "@/components/layout/PageHeader";

export default async function ComputersPage() {
  const supabase = await createClient();
  const { data: computers } = await supabase
    .from("computers")
    .select("*")
    .order("inventory_number");

  return (
    <div>
      <PageHeader
        title="Компьютеры"
        description="Список всего оборудования"
        action={{ label: "Добавить ПК", href: "/computers/new" }}
      />
      <ComputerTable computers={computers ?? []} />
    </div>
  );
}
