export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { unstable_noStore as noStore } from 'next/cache';
import { createServiceClient } from "@/lib/supabase/server";
import { FinancesClientView } from "@/components/finances/FinancesClientView";
import PageHeader from "@/components/layout/PageHeader";
import { extractJoinObject } from "@/lib/utils";

export default async function FinancesPage() {
  noStore();
  const supabase = createServiceClient();

  const { data: pools } = await supabase
    .from("license_pools")
    .select("id, license_type, total_seats, used_seats, price_per_unit, expires_at, software_id, software(name, vendor)")
    .eq("license_type", "subscription");

  const allPools = pools ?? [];

  // Calculate metrics
  const thisMonth = allPools.reduce((sum, p) => sum + p.price_per_unit * p.used_seats, 0);
  const nextMonth = thisMonth; // Same for subscriptions
  const currentMonthIndex = new Date().getMonth() + 1; // 1-12
  const yearTotal = thisMonth * currentMonthIndex;
  const activeSubscriptions = allPools.length;

  // Build breakdown data
  const breakdown = allPools.map((p) => {
    const sw = extractJoinObject(p.software as unknown) as { name: string; vendor: string | null } | null;
    const total = p.price_per_unit * p.used_seats;
    return {
      name: sw?.name ?? "—",
      vendor: sw?.vendor ?? "—",
      pricePerUnit: p.price_per_unit,
      installations: p.used_seats,
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