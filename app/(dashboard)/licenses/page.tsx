export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { unstable_noStore as noStore } from 'next/cache';
import { createServiceClient } from "@/lib/supabase/server";
import { LicensesPageClient } from "@/components/licenses/LicensesPageClient";
import { daysUntilExpiry } from "@/lib/utils";

export default async function LicensesPage() {
  noStore();
  const supabase = createServiceClient();

  const [poolsRes, installationsRes] = await Promise.all([
    supabase
      .from("license_pools")
      .select("id, license_type, total_seats, used_seats, expires_at, price_per_unit, software_id, software(name, vendor)")
      .order("created_at", { ascending: false }),
    supabase
      .from("software_installations")
      .select("id, computer_id, installed_at, software_id, license_pool_id, computers(inventory_number)")
      .order("installed_at", { ascending: false }),
  ]);

  const pools = poolsRes.data ?? [];
  const installations = installationsRes.data ?? [];

  // Calculate stats
  const totalPools = pools.length;
  const totalInstallations = pools.reduce((sum, p) => sum + p.used_seats, 0);

  // Expiring licenses
  const expiringLicenses = pools.filter((l) => {
    const days = daysUntilExpiry(l.expires_at);
    return days !== null && days <= 30;
  });

  return (
    <LicensesPageClient
      pools={pools}
      installations={installations}
      expiringLicenses={expiringLicenses}
      totalPools={totalPools}
      totalInstallations={totalInstallations}
    />
  );
}
