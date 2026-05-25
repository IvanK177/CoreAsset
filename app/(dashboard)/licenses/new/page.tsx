export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createServiceClient } from "@/lib/supabase/server";
import PageHeader from "@/components/layout/PageHeader";
import NewLicenseClient from "./NewLicenseClient";

export default async function NewLicensePage() {
  return (
    <div>
      <PageHeader title="Добавить лицензию" />
      <NewLicenseClient />
    </div>
  );
}
