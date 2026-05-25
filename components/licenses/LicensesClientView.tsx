"use client";

import { Fragment, useState } from "react";
import { cn, daysUntilExpiry, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Key, Clock, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";

interface LicenseRow {
  id: string;
  software_name: string;
  version: string | null;
  vendor: string | null;
  license_type: string;
  license_key: string | null;
  total_seats: number;
  used_seats: number;
  expires_at: string | null;
  price_per_unit: number | null;
  notes: string | null;
  created_at: string;
}

interface InstallationRow {
  id: string;
  computer_id: string;
  license_id: string;
  installed_at: string;
  computers: unknown;
}

interface LicensesClientViewProps {
  licenses: LicenseRow[];
  installations: InstallationRow[];
  expiringLicenses: LicenseRow[];
}

export function LicensesClientView({ licenses, installations, expiringLicenses }: LicensesClientViewProps) {
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

  // Get installations for a specific license
  const getLicenseInstallations = (licenseId: string) => {
    return installations.filter((i) => i.license_id === licenseId);
  };

  return (
    <div className="space-y-4">
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
              const days = daysUntilExpiry(l.expires_at);
              return (
                <Badge key={l.id} variant="outline" className="text-xs bg-white border-red-200 text-red-700">
                  {l.software_name ?? "—"} · {days} дн.
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
            {licenses.map((lic) => {
              const isExpanded = expandedIds.has(lic.id);
              const days = daysUntilExpiry(lic.expires_at);
              const isExpiring = days !== null && days <= 30;
              const pct = lic.total_seats > 0 ? (lic.used_seats / lic.total_seats) * 100 : 0;
              const licInstalls = getLicenseInstallations(lic.id);

              return (
                <Fragment key={lic.id}>
                  <tr
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => toggleExpanded(lic.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-[#2563eb] shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{lic.software_name}</p>
                          <p className="text-xs text-gray-500">{lic.vendor ?? "—"}{lic.version ? ` · v${lic.version}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {lic.license_type === "subscription" ? "Подписка" : "Бессрочная"}
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
                        <span className="text-sm text-gray-700">{lic.used_seats} / {lic.total_seats}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">
                        {(lic.price_per_unit ?? 0) > 0 ? `${(lic.price_per_unit ?? 0).toLocaleString("ru-RU")} ₽/ед.` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {lic.expires_at ? (
                        <div className="flex items-center gap-1">
                          {isExpiring && <Clock className="w-3.5 h-3.5 text-red-500" />}
                          <span className={cn("text-sm", isExpiring ? "text-red-600 font-medium" : "text-gray-500")}>
                            {formatDate(lic.expires_at)}
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
                    <tr key={`expanded-${lic.id}`} className="bg-gray-50">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="pl-6">
                          <p className="text-sm text-gray-600 mb-2">
                            Установлено на {licInstalls.length} устройствах:
                          </p>
                          {licInstalls.length > 0 ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              {licInstalls.map((inst) => {
                                const computer = (Array.isArray(inst.computers) ? inst.computers[0] : inst.computers) as { inventory_number: string } | null;
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