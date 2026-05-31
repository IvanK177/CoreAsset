"use client";

import { useState } from "react";
import { cn, extractJoinObject, BUILDING_ADDRESSES } from "@/lib/utils";
import { DollarSign, TrendingUp, Calendar, Package, Key, Building } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LicenseRow {
  id: string;
  software_name: string;
  vendor: string | null;
  license_type: string;
  total_seats: number;
  used_seats: number;
  price_per_unit: number | null;
  expires_at: string | null;
  created_at: string;
}

interface InstallationRow {
  id: string;
  device_id: string;
  license_id: string;
  installed_at: string;
  devices: unknown;
}

interface FinancesClientViewProps {
  licenses: LicenseRow[];
  installations: InstallationRow[];
}

const months = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

const fullMonths = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

export function FinancesClientView({ licenses, installations }: FinancesClientViewProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const currentMonth = new Date().getMonth(); // 0-11

  const [buildingFilter, setBuildingFilter] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_building_filter") || "all";
    }
    return "all";
  });

  const handleBuildingChange = (val: string) => {
    setBuildingFilter(val);
    localStorage.setItem("admin_building_filter", val);
  };

  // Re-calculate financial data dynamically based on selected building filter
  const monthlyCosts: number[] = Array(12).fill(0);
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

  for (const l of licenses) {
    const price = l.price_per_unit ?? 0;
    const createdDate = new Date(l.created_at);
    const createdMonth = createdDate.getMonth(); // 0-11
    const createdYear = createdDate.getFullYear();

    // Filter installations of this software in the selected building
    const licInstalls = installations.filter((inst) => {
      if (inst.license_id !== l.id) return false;
      if (buildingFilter === "all") return true;
      const dev = extractJoinObject(inst.devices) as {
        inventory_number: string | null;
        employees: { building: string | null } | { building: string | null }[] | null;
      } | null;
      const emp = dev ? extractJoinObject(dev.employees) : null;
      return emp && emp.building === buildingFilter;
    });

    const installCount = licInstalls.length;

    // Allocate seats
    // For subscription, seats = installations in this building (or l.used_seats if all)
    // For perpetual, seats = installations in this building (or l.total_seats if all)
    const seats = buildingFilter === "all"
      ? (l.license_type === "subscription" ? l.used_seats : l.total_seats)
      : installCount;

    if (l.license_type === "subscription") {
      const monthlyCost = price * seats;

      // Add to each month from creation month to current month (within this year)
      for (let m = 0; m <= currentMonth; m++) {
        if (createdYear < currentYear || (createdYear === currentYear && createdMonth <= m)) {
          monthlyCosts[m] += monthlyCost;
        }
      }

      subscriptionBreakdown.push({
        name: l.software_name ?? "—",
        vendor: l.vendor ?? "—",
        pricePerUnit: price,
        seats: seats,
        total: monthlyCost,
        type: "subscription",
      });
    } else if (l.license_type === "perpetual") {
      const oneTimeCost = price * seats;

      if (createdYear === currentYear && createdMonth <= currentMonth) {
        monthlyCosts[createdMonth] += oneTimeCost;
      }

      if (createdYear === currentYear && createdMonth === currentMonth) {
        perpetualBreakdown.push({
          name: l.software_name ?? "—",
          vendor: l.vendor ?? "—",
          pricePerUnit: price,
          seats: seats,
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
  const activeSubscriptions = subscriptionBreakdown.filter(s => s.seats > 0).length;

  // Combined breakdown for the table
  const breakdown = [...subscriptionBreakdown, ...perpetualBreakdown].filter(
    (item) => item.seats > 0 || buildingFilter === "all"
  );
  const grandTotal = breakdown.reduce((sum, b) => sum + b.total, 0);

  // Generate monthly data for chart
  const monthlyData = months.map((label, index) => ({
    label,
    value: monthlyCosts[index],
    isCurrent: index === currentMonth,
    isPast: index < currentMonth,
    isFuture: index > currentMonth,
  }));

  const maxBarValue = Math.max(...monthlyData.map((d) => d.value), 1);
  const currentMonthName = fullMonths[currentMonth];

  const handleExportToExcel = () => {
    let html = `<table border="1">
      <thead>
        <tr style="background-color: #f3f4f6; font-weight: bold;">
          <th>Программа</th>
          <th>Вендор</th>
          <th>Тип</th>
          <th>Цена / ед. (руб)</th>
          <th>Мест / Установок</th>
          <th>Итого (руб)</th>
          <th>Доля (%)</th>
        </tr>
      </thead>
      <tbody>`;

    breakdown.forEach((item) => {
      const share = grandTotal > 0 ? ((item.total / grandTotal) * 100).toFixed(1) : "0.0";
      const typeText = item.type === "subscription" ? "Подписка" : "Бессрочная";
      html += `<tr>
        <td>${item.name}</td>
        <td>${item.vendor}</td>
        <td>${typeText}</td>
        <td>${item.pricePerUnit}</td>
        <td>${item.seats}</td>
        <td>${item.total}</td>
        <td>${share}%</td>
      </tr>`;
    });

    html += `</tbody></table>`;

    const blob = new Blob(["\ufeff" + html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finances_report_${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Building Filter Bar */}
      <div className="flex items-center gap-2 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <Building className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Корпус:</span>
        <select
          value={buildingFilter}
          onChange={(e) => handleBuildingChange(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none max-w-[240px] truncate"
        >
          <option value="all">Все корпуса</option>
          {Object.keys(BUILDING_ADDRESSES).map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="В этом месяце"
          value={`${thisMonth.toLocaleString("ru-RU")} ₽`}
          icon={DollarSign}
          iconBgColor="bg-[#dbeafe]"
          iconTextColor="text-[#2563eb]"
        />
        <MetricCard
          label="Следующий месяц"
          value={`${nextMonth.toLocaleString("ru-RU")} ₽`}
          icon={TrendingUp}
          iconBgColor="bg-[#dcfce7]"
          iconTextColor="text-green-600"
        />
        <MetricCard
          label="За год факт"
          value={`${yearTotal.toLocaleString("ru-RU")} ₽`}
          icon={Calendar}
          iconBgColor="bg-[#dcfce7]"
          iconTextColor="text-green-600"
        />
        <MetricCard
          label="Активных подписок"
          value={activeSubscriptions}
          icon={Package}
          iconBgColor="bg-orange-100"
          iconTextColor="text-orange-600"
        />
      </div>

      {/* Bar Chart */}
      <div className="rounded-xl bg-white shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Расходы по месяцам</h2>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
          >
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear - 1}>{currentYear - 1}</option>
          </select>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex items-end gap-2 h-[200px] min-w-[500px]">
            {monthlyData.map((month) => {
              const heightPct = maxBarValue > 0 ? (month.value / maxBarValue) * 100 : 0;
              return (
                <div key={month.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 font-medium">
                    {month.value > 0 ? `${(month.value / 1000).toFixed(0)}k` : "0"}
                  </span>
                  <div className="w-full relative" style={{ height: "160px" }}>
                    <div
                      className={cn(
                        "absolute bottom-0 w-full rounded-t-md transition-all",
                        month.isCurrent ? "bg-[#2563eb]" :
                        month.isPast ? "bg-[#93c5fd]" :
                        "bg-[#374151]"
                      )}
                      style={{ height: `${heightPct}%`, minHeight: month.value > 0 ? "4px" : "0" }}
                    />
                  </div>
                  <span className={cn(
                    "text-xs",
                    month.isCurrent ? "text-[#2563eb] font-semibold" : "text-gray-500"
                  )}>
                    {month.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Разбивка по ПО — {currentMonthName} {selectedYear}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Программа</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Вендор</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Тип</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Цена / ед.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Мест / Установок</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Итого</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Доля</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((item) => {
                const share = grandTotal > 0 ? (item.total / grandTotal) * 100 : 0;
                return (
                  <tr key={`${item.type}-${item.name}`} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.vendor}</td>
                    <td className="px-4 py-3">
                      {item.type === "subscription" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          <Package className="w-3 h-3" /> Подписка
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                          <Key className="w-3 h-3" /> Бессрочная
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.pricePerUnit.toLocaleString("ru-RU")} ₽</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.seats}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.total.toLocaleString("ru-RU")} ₽</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              item.type === "subscription" ? "bg-[#2563eb]" : "bg-green-500"
                            )}
                            style={{ width: `${Math.min(share, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{share.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export to XLS Button */}
      <div className="flex justify-end mt-4">
        <Button
          onClick={handleExportToExcel}
          className="bg-green-600 hover:bg-green-700 text-white gap-2 text-sm font-medium h-9 rounded-lg"
        >
          Экспорт в XLS
        </Button>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  iconBgColor,
  iconTextColor,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor: string;
  iconTextColor: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm flex items-center gap-4">
      <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg", iconBgColor)}>
        <Icon className={cn("w-5 h-5", iconTextColor)} />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}