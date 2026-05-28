"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DollarSign, TrendingUp, Calendar, Package, Key } from "lucide-react";

interface BreakdownItem {
  name: string;
  vendor: string;
  pricePerUnit: number;
  seats: number;
  total: number;
  type: "subscription" | "perpetual";
}

interface FinancesClientViewProps {
  thisMonth: number;
  nextMonth: number;
  yearTotal: number;
  activeSubscriptions: number;
  breakdown: BreakdownItem[];
  grandTotal: number;
  monthlyCosts: number[];
}

const months = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

const fullMonths = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

export function FinancesClientView({
  thisMonth,
  nextMonth,
  yearTotal,
  activeSubscriptions,
  breakdown,
  grandTotal,
  monthlyCosts,
}: FinancesClientViewProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const currentMonth = new Date().getMonth(); // 0-11

  // Generate monthly data from the server-provided monthlyCosts array
  const monthlyData = months.map((label, index) => ({
    label,
    value: monthlyCosts[index],
    isCurrent: index === currentMonth,
    isPast: index < currentMonth,
    isFuture: index > currentMonth,
  }));

  const maxBarValue = Math.max(...monthlyData.map((d) => d.value), 1);

  // Current month name for table header
  const currentMonthName = fullMonths[currentMonth];

  return (
    <div className="space-y-6">
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
                      {item.type === "subscription" ? item.seats : item.seats}
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