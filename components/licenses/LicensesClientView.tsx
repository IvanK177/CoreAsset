"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn, daysUntilExpiry, formatDate, extractJoinObject, BUILDING_ADDRESSES } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { deleteLicenseDialog } from "@/lib/actions/licenses";
import { clearCache } from "@/lib/actions/revalidate";
import { Key, Clock, ChevronDown, ChevronUp, CheckCircle, Eye, EyeOff, Copy, Building } from "lucide-react";
import { toast } from "sonner";

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
  device_id: string;
  license_id: string;
  installed_at: string;
  devices: unknown;
}

interface LicensesClientViewProps {
  licenses: LicenseRow[];
  installations: InstallationRow[];
  expiringLicenses: LicenseRow[];
  buildingFilter: string;
  onBuildingFilterChange: (val: string) => void;
}

export function LicensesClientView({
  licenses,
  installations,
  expiringLicenses,
  buildingFilter,
  onBuildingFilterChange,
}: LicensesClientViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const router = useRouter();

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
    const rawInst = installations.filter((i) => i.license_id === licenseId);
    if (buildingFilter === "all") return rawInst;
    return rawInst.filter((inst) => {
      const dev = extractJoinObject(inst.devices) as {
        inventory_number: string | null;
        employees: { building: string | null } | { building: string | null }[] | null;
      } | null;
      const emp = dev ? extractJoinObject(dev.employees) : null;
      return emp && emp.building === buildingFilter;
    });
  };

  const filteredExpiring = expiringLicenses.filter((lic) => {
    if (buildingFilter === "all") return true;
    const licInstalls = installations.filter(i => i.license_id === lic.id).filter((inst) => {
      const dev = extractJoinObject(inst.devices) as {
        inventory_number: string | null;
        employees: { building: string | null } | { building: string | null }[] | null;
      } | null;
      const emp = dev ? extractJoinObject(dev.employees) : null;
      return emp && emp.building === buildingFilter;
    });
    return licInstalls.length > 0;
  });

  return (
    <div className="space-y-4">
      {/* Expiring licenses alert banner */}
      {filteredExpiring.length > 0 && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-sm font-semibold text-red-700">
              Истекают подписки ({filteredExpiring.length})
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {filteredExpiring.map((l) => {
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

      {/* Building Filter Bar */}
      <div className="flex items-center gap-2 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <Building className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Корпус:</span>
        <select
          value={buildingFilter}
          onChange={(e) => onBuildingFilterChange(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none max-w-[240px] truncate"
        >
          <option value="all">Все корпуса</option>
          {Object.keys(BUILDING_ADDRESSES).map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Table with expandable rows */}
      <div className="rounded-xl bg-white shadow-sm overflow-x-auto">
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
              const licInstalls = getLicenseInstallations(lic.id);
              const usedSeats = licInstalls.length;
              const pct = lic.total_seats > 0 ? (usedSeats / lic.total_seats) * 100 : 0;

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
                        <span className="text-sm text-gray-700">{usedSeats} / {lic.total_seats}</span>
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
                        <div className="pl-6 flex items-start justify-between">
                          <div className="space-y-4">
                            {lic.license_key && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                  Лицензионный ключ
                                </p>
                                <div className="flex items-center gap-2">
                                  <code className="text-sm bg-white px-2.5 py-1 rounded border border-gray-200 font-mono text-gray-800 font-semibold">
                                    {showKeys.has(lic.id) ? lic.license_key : "••••-••••-••••-••••"}
                                  </code>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleShowKey(lic.id);
                                    }}
                                    className="p-1.5 rounded hover:bg-gray-200/50 text-gray-400 hover:text-gray-600 transition-colors"
                                    title={showKeys.has(lic.id) ? "Скрыть" : "Показать"}
                                  >
                                    {showKeys.has(lic.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(lic.license_key || "");
                                      toast.success("Ключ скопирован в буфер обмена");
                                    }}
                                    className="p-1.5 rounded hover:bg-gray-200/50 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Копировать"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}

                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Установлено на {licInstalls.length} устройствах:
                              </p>
                              {licInstalls.length > 0 ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  {licInstalls.map((inst) => {
                                    const device = (Array.isArray(inst.devices) ? inst.devices[0] : inst.devices) as { inventory_number: string } | null;
                                    return (
                                      <Badge key={inst.id} variant="outline" className="text-xs bg-white border-gray-200 text-gray-700">
                                        {device?.inventory_number ?? "—"} с {formatDate(inst.installed_at)}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-400">Нет установок</p>
                              )}
                            </div>
                          </div>
                          <DeleteConfirmDialog
                            onConfirm={async () => {
                              await deleteLicenseDialog(lic.id);
                              await clearCache('/licenses');
                              await clearCache('/dashboard');
                              startTransition(() => { router.refresh(); });
                            }}
                            description="Лицензия и все её установки будут удалены безвозвратно."
                          />
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