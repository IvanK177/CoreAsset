export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { unstable_noStore as noStore } from 'next/cache';
import { createServiceClient } from "@/lib/supabase/server";
import { FinancesClientView } from "@/components/finances/FinancesClientView";
import PageHeader from "@/components/layout/PageHeader";

export default async function FinancesPage() {
  noStore();
  const supabase = createServiceClient();

  const { data: licenses } = await supabase
    .from("licenses")
    .select("id, software_name, vendor, license_type, total_seats, used_seats, price_per_unit, expires_at")
    .eq("license_type", "subscription");

  const allLicenses = licenses ?? [];

  // Calculate metrics
  const thisMonth = allLicenses.reduce((sum, l) => sum + (l.price_per_unit ?? 0) * l.used_seats, 0);
  const nextMonth = thisMonth; // Same for subscriptions
  const currentMonthIndex = new Date().getMonth() + 1; // 1-12
  const yearTotal = thisMonth * currentMonthIndex;
  const activeSubscriptions = allLicenses.length;

  // Build breakdown data
  const breakdown = allLicenses.map((l) => {
    const total = (l.price_per_unit ?? 0) * l.used_seats;
    return {
      name: l.software_name ?? "—",
      vendor: l.vendor ?? "—",
      pricePerUnit: l.price_per_unit ?? 0,
      installations: l.used_seats,
      total,
    };
  });

  const grandTotal = breakdown.reduce((sum, b) => sum + b.total, 0);

  return (
    <div>
      <PageHeader
        title="Финансы · Расходы на ПО"
        description="FinOps — учёт расходов по активным подпискам"
      />
      <FinancesClientView
        thisMonth={thisMonth}
        nextMonth={nextMonth}
        yearTotal={yearTotal}
        activeSubscriptions={activeSubscriptions}
        breakdown={breakdown}
        grandTotal={grandTotal}
      />
    </div>
  );
}