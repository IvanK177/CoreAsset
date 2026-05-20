import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/layout/PageHeader";
import NewLicensePoolClient from "./NewLicensePoolClient";

export default async function NewLicensePoolPage() {
  const supabase = await createClient();
  const { data: software } = await supabase.from("software").select("id, name, version").order("name");

  return (
    <div>
      <PageHeader title="Добавить пул лицензий" />
      <NewLicensePoolClient software={software ?? []} />
    </div>
  );
}
