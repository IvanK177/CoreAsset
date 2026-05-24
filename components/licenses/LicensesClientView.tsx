"use client";

import { Fragment, useState } from "react";
import { cn, daysUntilExpiry, formatDate, extractJoinObject } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Key, Clock, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

interface PoolRow {
  id: string;
  license_type: string;
  total_seats: number;
  used_seats: number;
  expires_at: string | null;
  price_per_unit: number;
  software_id: string;
  software: unknown;
}

interface InstallationRow {
  id: string;
  computer_id: string;
  installed_at: string;
  software_id: string;
  license_pool_id: string | null;
  computers: unknown;
}

interface LicensesClientViewProps {
  pools: PoolRow[];
  installations: InstallationRow[];
  expiringLicenses: PoolRow[];
}

export function LicensesClientView({ pools, installations, expiringLicenses }: LicensesClientViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Get installations for a specific pool
  const getPoolInstallations = (poolId: string) => {
    return installations.filter((i) => i.license_pool_id === poolId);
  };

  return (
    <div className="space-y-4">
      {/* Software directory link */}
      <div className="flex justify-end">
        <Link href="/licenses/software" className={buttonVariants({ variant: "outline", size: "sm" }) + " gap-2"}>
          <BookOpen className="w-4 h-4" /> Справочник ПО
        </Link>
      </div>

      {/* Expiring licenses alert banner */}
      {expiringLicenses.length > 0 && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-sm font-semibold text-red-700">
              Истекают подписки ({expiringLicenses.length})
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {expiringLicenses.map((l) => {
              const sw = extractJoinObject(l.software as unknown) as { name: string; vendor: string | null } | null;
              const days = daysUntilExpiry(l.expires_at);
              return (
                <Badge key={l.id} variant="outline" className="text-xs bg-white border-red-200 text-red-700">
                  {sw?.name ?? "—"} · {days} дн.
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Table with expandable rows */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Программа</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Тип</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Использование</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Стоимость</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Истекает</th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody>
            {pools.map((pool) => {
              const sw = extractJoinObject(pool.software as unknown) as { name: string; vendor: string | null } | null;
              const isExpanded = expandedIds.has(pool.id);
              const days = daysUntilExpiry(pool.expires_at);
              const isExpiring = days !== null && days <= 30;
              const pct = pool.total_seats > 0 ? (pool.used_seats / pool.total_seats) * 100 : 0;
              const poolInstalls = getPoolInstallations(pool.id);

              return (
                <Fragment key={pool.id}>
                  <tr
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => toggleExpanded(pool.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-[#2563eb] shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{sw?.name ?? "—"}</p>
                          <p className="text-xs text-gray-500">{sw?.vendor ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {pool.license_type === "subscription" ? "Подписка" : "Бессрочная"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              pct < 70 ? "bg-[#2563eb]" : pct < 90 ? "bg-yellow-500" : "bg-red-500"
                            )}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-700">{pool.used_seats} / {pool.total_seats}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">
                        {pool.price_per_unit > 0 ? `${pool.price_per_unit.toLocaleString("ru-RU")} ₽/ед.` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {pool.expires_at ? (
                        <div className="flex items-center gap-1">
                          {isExpiring && <Clock className="w-3.5 h-3.5 text-red-500" />}
                          <span className={cn("text-sm", isExpiring ? "text-red-600 font-medium" : "text-gray-500")}>
                            {formatDate(pool.expires_at)}
                            {isExpiring && ` (${days} дн.)`}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-500">Бессрочно</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {isExpanded && (
                    <tr key={`expanded-${pool.id}`} className="bg-gray-50">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="pl-6">
                          <p className="text-sm text-gray-600 mb-2">
                            Установлено на {poolInstalls.length} устройствах:
                          </p>
                          {poolInstalls.length > 0 ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              {poolInstalls.map((inst) => {
                                const computer = extractJoinObject(inst.computers as unknown) as { inventory_number: string } | null;
                                return (
                                  <Badge key={inst.id} variant="outline" className="text-xs bg-white border-gray-200 text-gray-700">
                                    {computer?.inventory_number ?? "—"} с {formatDate(inst.installed_at)}
                                  </Badge>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">Нет установок</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}