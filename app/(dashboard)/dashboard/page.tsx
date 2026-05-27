export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { unstable_noStore as noStore } from 'next/cache';
import {
  getCachedComputers,
  getCachedIncidentsWithRelations,
  getCachedLicenses,
  getCachedEmployees,
} from "@/lib/supabase/cached";
import { StatCard } from "@/components/dashboard/StatCard";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { IncidentStatusBadge } from "@/components/shared/StatusBadge";
import { cn, formatDate, daysUntilExpiry, extractJoinObject } from "@/lib/utils";
import { Monitor, Package, Wrench, AlertTriangle, DollarSign, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  noStore();

  const [computers, rawIncidents, rawLicenses, employees] = await Promise.all([
    getCachedComputers(),
    getCachedIncidentsWithRelations(),
    getCachedLicenses(),
    getCachedEmployees(),
  ]);

  const openIncidents = (rawIncidents as any[])
    .filter((inc) => inc.status !== "resolved")
    .slice(0, 10)
    .map((inc) => ({
      ...inc,
      computers: inc.computers || inc["computers!incidents_computer_id_fkey"],
    }));

  const allLicenses = rawLicenses.filter((l) => l.license_type === "subscription");
  const allIncidents = rawIncidents;

  // Metrics
  const total = computers.filter((c) => c.lifecycle_status !== "decommissioned").length;
  const occupied = computers.filter((c) => c.lifecycle_status === "active").length;
  const warehouse = computers.filter((c) => c.lifecycle_status === "storage").length;
  const repair = computers.filter((c) => c.lifecycle_status === "repair").length;
  const openTicketsCount = allIncidents.filter((i) => i.status !== "resolved").length;
  const criticalHighCount = openIncidents.filter((i) => i.priority === "critical" || i.priority === "high").length;

  // Monthly cost
  const monthlyCost = allLicenses.reduce((sum, l) => sum + (l.price_per_unit || 0) * l.used_seats, 0);

  // Expiring licenses
  const expiringLicenses = allLicenses.filter((l) => {
    const days = daysUntilExpiry(l.expires_at);
    return days !== null && days <= 30;
  });

  // Employee stats
  const activeEmployees = employees.filter((e) => e.is_active).length;
  const dismissedEmployees = employees.filter((e) => !e.is_active).length;
  const resolvedTickets = allIncidents.filter((i) => i.status === "resolved").length;

  // Current date formatted
  const currentDate = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  // License usage data
  const licenseUsage = allLicenses.map((l) => {
    const pct = l.total_seats > 0 ? (l.used_seats / l.total_seats) * 100 : 0;
    return {
      name: l.software_name ?? "—",
      used: l.used_seats,
      total: l.total_seats,
      pct,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
        <p className="text-sm text-gray-500 mt-1">{currentDate}</p>
      </div>

      {/* 5 Metric Cards */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          label="Занятые ПК"
          value={occupied}
          subtitle={`из ${total} всего`}
          icon={Monitor}
          iconBgColor="bg-emerald-100"
          iconTextColor="text-emerald-600"
          href="/computers?filter=active"
        />
        <StatCard
          label="На складе"
          value={warehouse}
          subtitle="свободно для выдачи"
          icon={Package}
          iconBgColor="bg-blue-100"
          iconTextColor="text-blue-600"
          href="/computers?filter=storage"
        />
        <StatCard
          label="В ремонте"
          value={repair}
          subtitle="на обслуживании"
          icon={Wrench}
          iconBgColor="bg-orange-100"
          iconTextColor="text-orange-600"
          href="/computers?filter=repair"
        />
        <StatCard
          label="Открытые тикеты"
          value={openTicketsCount}
          subtitle={`${criticalHighCount} критических/высоких`}
          icon={AlertTriangle}
          iconBgColor="bg-[#fee2e2]"
          iconTextColor="text-red-600"
          href="/incidents"
        />
        <StatCard
          label="Расходы / месяц"
          value={`${monthlyCost.toLocaleString("ru-RU")} ₽`}
          subtitle="по активным подпискам"
          icon={DollarSign}
          iconBgColor="bg-[#ede9fe]"
          iconTextColor="text-purple-600"
          href="/finances"
        />
      </div>

      {/* Bottom: Two columns */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Recent Incidents (2/3) */}
        <div className="col-span-2 rounded-xl bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Последние заявки</h2>
            <Link href="/incidents" className="text-sm text-[#2563eb] font-medium hover:underline flex items-center gap-1">
              Все заявки <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {openIncidents.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">Нет открытых заявок</p>
          ) : (
            <div className="space-y-3">
              {openIncidents.map((inc) => {
                const computer = extractJoinObject(inc.computers as unknown) as { inventory_number: string } | null;
                return (
                  <Link
                    key={inc.id}
                    href={`/incidents?selectedId=${inc.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-mono">#T{inc.id.slice(0, 4)}</span>
                        <span className="text-sm font-semibold text-gray-900 truncate">{inc.description}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {computer?.inventory_number ?? "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <PriorityBadge priority={inc.priority} />
                      <IncidentStatusBadge status={inc.status} />
                      <span className="text-xs text-gray-400">{formatDate(inc.created_at)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Sidebar sections (1/3) */}
        <div className="space-y-4">
          {/* Expiring Licenses */}
          {expiringLicenses.length > 0 && (
            <div className="border border-red-200 bg-red-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-red-500 shrink-0" />
                <h3 className="text-sm font-semibold text-red-700">Истекают лицензии</h3>
              </div>
              <div className="space-y-2">
                {expiringLicenses.map((l) => {
                  const days = daysUntilExpiry(l.expires_at);
                  return (
                    <div key={l.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{l.software_name ?? "—"}</p>
                        <p className="text-xs text-gray-500">{l.vendor ?? "—"}</p>
                      </div>
                      <span className="text-xs font-medium text-red-600">через {days} дн.</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Employees */}
          <div className="rounded-xl bg-white shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Сотрудники</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Активных</span>
                <span className="text-sm font-semibold text-gray-900">{activeEmployees}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Уволенных</span>
                <span className="text-sm font-semibold text-gray-900">{dismissedEmployees}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Тикетов решено</span>
                <span className="text-sm font-semibold text-gray-900">{resolvedTickets}</span>
              </div>
            </div>
          </div>

          {/* License Usage */}
          <div className="rounded-xl bg-white shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Использование лицензий</h3>
            <div className="space-y-3">
              {licenseUsage.map((lu) => (
                <div key={lu.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{lu.name}</span>
                    <span className="text-sm font-medium text-gray-900">{lu.used}/{lu.total}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        lu.pct < 70 ? "bg-[#2563eb]" : lu.pct < 90 ? "bg-yellow-500" : "bg-red-500"
                      )}
                      style={{ width: `${Math.min(lu.pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
