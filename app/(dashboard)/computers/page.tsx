import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ComputersClientView } from "@/components/computers/ComputersClientView";
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
      <Suspense fallback={<div className="text-muted-foreground text-sm">Загрузка...</div>}>
        <ComputersClientView computers={computers ?? []} />
      </Suspense>
    </div>
  );
}
