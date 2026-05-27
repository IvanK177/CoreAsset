export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { LicensesPageClient } from "@/components/licenses/LicensesPageClient";
import { daysUntilExpiry } from "@/lib/utils";
import { getCachedLicenses, getCachedComputerLicensesWithComputers } from "@/lib/supabase/cached";

export default async function LicensesPage() {
  const [licenses, installations] = await Promise.all([
    getCachedLicenses(),
    getCachedComputerLicensesWithComputers() as any,
  ]);

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
