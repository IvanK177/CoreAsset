export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { unstable_noStore as noStore } from 'next/cache';
import { createServiceClient } from "@/lib/supabase/server";
import { FinancesClientView } from "@/components/finances/FinancesClientView";
import PageHeader from "@/components/layout/PageHeader";
import { getCachedDeviceLicensesWithDevices } from "@/lib/supabase/cached";

export default async function FinancesPage() {
  noStore();
  const supabase = createServiceClient();

  // Fetch ALL licenses and installations
  const [licensesRes, installations] = await Promise.all([
    supabase
      .from("licenses")
      .select("id, software_name, vendor, license_type, total_seats, used_seats, price_per_unit, expires_at, created_at"),
    getCachedDeviceLicensesWithDevices()
  ]);

  const licenses = licensesRes.data ?? [];

  return (
    <div>
      <PageHeader
        title="Финансы · Расходы на ПО"
        description="Учёт расходов на подписки и бессрочные лицензии"
      />
      <FinancesClientView
        licenses={licenses as unknown as Parameters<typeof FinancesClientView>[0]["licenses"]}
        installations={installations as unknown as Parameters<typeof FinancesClientView>[0]["installations"]}
      />
    </div>
  );
}