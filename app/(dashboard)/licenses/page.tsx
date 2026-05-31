export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { LicensesPageClient } from "@/components/licenses/LicensesPageClient";
import { daysUntilExpiry } from "@/lib/utils";
import { getCachedLicenses, getCachedDeviceLicensesWithDevices } from "@/lib/supabase/cached";

export default async function LicensesPage() {
  const [licenses, installations] = await Promise.all([
    getCachedLicenses(),
    getCachedDeviceLicensesWithDevices() as Promise<unknown[]>,
  ]);

  // Calculate stats
  const totalLicenses = licenses.length;

  // Normalize licenses
  const normalizedLicenses = licenses.map((l) => ({
    ...l,
    license_type: l.license_type || "perpetual",
    created_at: l.created_at || new Date().toISOString(),
  }));

  // Expiring licenses
  const expiringLicenses = normalizedLicenses.filter((l) => {
    const days = daysUntilExpiry(l.expires_at);
    return days !== null && days <= 30;
  });

  return (
    <LicensesPageClient
      licenses={normalizedLicenses}
      installations={installations as unknown as Parameters<typeof LicensesPageClient>[0]["installations"]}
      expiringLicenses={expiringLicenses}
      totalLicenses={totalLicenses}
    />
  );
}
