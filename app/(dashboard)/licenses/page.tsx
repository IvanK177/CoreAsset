export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { unstable_noStore as noStore } from 'next/cache';
import { createServiceClient } from "@/lib/supabase/server";
import { LicensesPageClient } from "@/components/licenses/LicensesPageClient";
import { daysUntilExpiry } from "@/lib/utils";

export default async function LicensesPage() {
  noStore();
  const supabase = createServiceClient();

  const [licensesRes, installationsRes] = await Promise.all([
    supabase
      .from("licenses")
      .select("id, software_name, version, vendor, license_type, license_key, total_seats, used_seats, expires_at, price_per_unit, notes, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("computer_licenses")
      .select("id, computer_id, license_id, installed_at, computers(inventory_number)")
      .order("installed_at", { ascending: false }),
  ]);

  const licenses = licensesRes.data ?? [];
  const installations = installationsRes.data ?? [];

  // Calculate stats
  const totalLicenses = licenses.length;
  const totalInstallations = licenses.reduce((sum, l) => sum + l.used_seats, 0);

  // Expiring licenses
  const expiringLicenses = licenses.filter((l) => {
    const days = daysUntilExpiry(l.expires_at);
    return days !== null && days <= 30;
  });

  return (
    <LicensesPageClient
      licenses={licenses}
      installations={installations}
      expiringLicenses={expiringLicenses}
      totalLicenses={totalLicenses}
      totalInstallations={totalInstallations}
    />
  );
}
