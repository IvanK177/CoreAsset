export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { LicensesPageClient } from "@/components/licenses/LicensesPageClient";
import { daysUntilExpiry } from "@/lib/utils";
import { getCachedLicenses, getCachedComputerLicensesWithComputers } from "@/lib/supabase/cached";

export default async function LicensesPage() {
  const [licenses, installations] = await Promise.all([
    getCachedLicenses(),
    getCachedComputerLicensesWithComputers() as Promise<unknown[]>,
  ]);

  // Calculate stats
  const totalLicenses = licenses.length;

  // Expiring licenses
  const expiringLicenses = licenses.filter((l) => {
    const days = daysUntilExpiry(l.expires_at);
    return days !== null && days <= 30;
  });

  return (
    <LicensesPageClient
      licenses={licenses}
      installations={installations as unknown as Parameters<typeof LicensesPageClient>[0]["installations"]}
      expiringLicenses={expiringLicenses}
      totalLicenses={totalLicenses}
    />
  );
}
