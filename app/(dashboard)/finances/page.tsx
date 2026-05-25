export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { unstable_noStore as noStore } from 'next/cache';
import { createServiceClient } from "@/lib/supabase/server";
import { FinancesClientView } from "@/components/finances/FinancesClientView";
import PageHeader from "@/components/layout/PageHeader";

export default async function FinancesPage() {
  noStore();
  const supabase = createServiceClient();

  // Fetch ALL licenses (both subscription and perpetual) with created_at
  const { data: licenses } = await supabase
    .from("licenses")
    .select("id, software_name, vendor, license_type, total_seats, used_seats, price_per_unit, expires_at, created_at");

  const allLicenses = licenses ?? [];

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11

  // Build monthly costs array — each month gets subscription recurring + perpetual one-time
  const monthlyCosts: number[] = Array(12).fill(0);

  // Breakdown items for the current month table
  const subscriptionBreakdown: Array<{
    name: string;
    vendor: string;
    pricePerUnit: number;
    seats: number;
    total: number;
    type: "subscription";
  }> = [];

  const perpetualBreakdown: Array<{
    name: string;
    vendor: string;
    pricePerUnit: number;
    seats: number;
    total: number;
    type: "perpetual";
  }> = [];

  for (const l of allLicenses) {
    const price = l.price_per_unit ?? 0;
    const createdDate = new Date(l.created_at);
    const createdMonth = createdDate.getMonth(); // 0-11
    const createdYear = createdDate.getFullYear();

    if (l.license_type === "subscription") {
      // Subscription: recurring monthly cost = price_per_unit * used_seats
      const monthlyCost = price * l.used_seats;

      // Add to each month from creation month to current month (within this year)
      for (let m = 0; m <= currentMonth; m++) {
        if (createdYear < currentYear || (createdYear === currentYear && createdMonth <= m)) {
          monthlyCosts[m] += monthlyCost;
        }
      }

      // Always show subscriptions in the current month breakdown
      subscriptionBreakdown.push({
        name: l.software_name ?? "—",
        vendor: l.vendor ?? "—",
        pricePerUnit: price,
        seats: l.used_seats,
        total: monthlyCost,
        type: "subscription",
      });
    } else if (l.license_type === "perpetual") {
      // Perpetual: one-time cost = price_per_unit * total_seats, only in the month of addition
      const oneTimeCost = price * l.total_seats;

      if (createdYear === currentYear && createdMonth <= currentMonth) {
        monthlyCosts[createdMonth] += oneTimeCost;
      }

      // Show in breakdown only if added this month
      if (createdYear === currentYear && createdMonth === currentMonth) {
        perpetualBreakdown.push({
          name: l.software_name ?? "—",
          vendor: l.vendor ?? "—",
          pricePerUnit: price,
          seats: l.total_seats,
          total: oneTimeCost,
          type: "perpetual",
        });
      }
    }
  }

  // Metrics
  const thisMonth = monthlyCosts[currentMonth];
  const nextMonth = subscriptionBreakdown.reduce((sum, s) => sum + s.total, 0); // Only subscriptions recur next month
  const yearTotal = monthlyCosts.reduce((sum, v) => sum + v, 0);
  const activeSubscriptions = subscriptionBreakdown.length;

  // Combined breakdown for the table
  const breakdown = [...subscriptionBreakdown, ...perpetualBreakdown];
  const grandTotal = breakdown.reduce((sum, b) => sum + b.total, 0);

  return (
    <div>
      <PageHeader
        title="Финансы · Расходы на ПО"
        description="FinOps — учёт расходов на подписки и бессрочные лицензии"
      />
      <FinancesClientView
        thisMonth={thisMonth}
        nextMonth={nextMonth}
        yearTotal={yearTotal}
        activeSubscriptions={activeSubscriptions}
        breakdown={breakdown}
        grandTotal={grandTotal}
        monthlyCosts={monthlyCosts}
      />
    </div>
  );
}