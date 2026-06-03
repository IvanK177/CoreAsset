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
        <div className="border border-red-500/20 bg-red-500/10 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-sm font-semibold text-red-600 dark:text-red-400">
              Истекают подписки ({filteredExpiring.length})
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {filteredExpiring.map((l) => {
              const days = daysUntilExpiry(l.expires_at);
              return (
                <Badge key={l.id} variant="outline" className="text-xs bg-card border-red-500/20 text-red-600 dark:text-red-400">
                  {l.software_name ?? "—"} · {days} дн.
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Building Filter Bar */}
      <div className="flex items-center gap-2 bg-card p-4 rounded-xl border border-border shadow-sm">
        <Building className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Корпус:</span>
        <select
          value={buildingFilter}
          onChange={(e) => onBuildingFilterChange(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-blue-500 focus:outline-none max-w-[240px] truncate"
        >
          <option value="all">Все корпуса</option>
          {Object.keys(BUILDING_ADDRESSES).map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Table with expandable rows */}
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Программа</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Тип</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Использование</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Стоимость</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Истекает</th>
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
                    className="border-b border-border hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => toggleExpanded(lic.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-[#2563eb] shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{lic.software_name}</p>
                          <p className="text-xs text-muted-foreground">{lic.vendor ?? "—"}{lic.version ? ` · v${lic.version}` : ""}</p>
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
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              pct < 70 ? "bg-[#2563eb]" : pct < 90 ? "bg-yellow-500" : "bg-red-500"
                            )}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{usedSeats} / {lic.total_seats}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">
                        {(lic.price_per_unit ?? 0) > 0 ? `${(lic.price_per_unit ?? 0).toLocaleString("ru-RU")} ₽/ед.` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {lic.expires_at ? (
                        <div className="flex items-center gap-1">
                          {isExpiring && <Clock className="w-3.5 h-3.5 text-red-500" />}
                          <span className={cn("text-sm", isExpiring ? "text-red-600 font-medium" : "text-muted-foreground")}>
                            {formatDate(lic.expires_at)}
                            {isExpiring && ` (${days} дн.)`}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-muted-foreground">Бессрочно</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {isExpanded && (
                    <tr key={`expanded-${lic.id}`} className="bg-muted/20 border-b border-border">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="pl-6 flex items-start justify-between">
                          <div className="space-y-4">
                            {lic.license_key && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                  Лицензионный ключ
                                </p>
                                <div className="flex items-center gap-2">
                                  <code className="text-sm bg-card px-2.5 py-1 rounded border border-border font-mono text-foreground font-semibold">
                                    {showKeys.has(lic.id) ? lic.license_key : "••••-••••-••••-••••"}
                                  </code>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleShowKey(lic.id);
                                    }}
                                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
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
                                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    title="Копировать"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}

                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Установлено на {licInstalls.length} устройствах:
                              </p>
                              {licInstalls.length > 0 ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  {licInstalls.map((inst) => {
                                    const device = (Array.isArray(inst.devices) ? inst.devices[0] : inst.devices) as { inventory_number: string } | null;
                                    return (
                                      <Badge key={inst.id} variant="outline" className="text-xs bg-card border-border text-foreground">
                                        {device?.inventory_number ?? "—"} с {formatDate(inst.installed_at)}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">Нет установок</p>
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