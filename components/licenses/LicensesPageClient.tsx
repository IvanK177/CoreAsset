"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { LicensesClientView } from "@/components/licenses/LicensesClientView";
import { extractJoinObject } from "@/lib/utils";
import dynamic from "next/dynamic";

const AddLicenseDialog = dynamic(
  () => import("@/components/licenses/AddLicenseDialog").then((mod) => mod.AddLicenseDialog),
  { ssr: false }
);

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

interface LicensesPageClientProps {
  licenses: LicenseRow[];
  installations: InstallationRow[];
  expiringLicenses: LicenseRow[];
  totalLicenses: number;
}

export function LicensesPageClient({
  licenses,
  installations,
  expiringLicenses,
  totalLicenses,
}: LicensesPageClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
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

  const filteredInstallationsCount = installations.filter((inst) => {
    if (buildingFilter === "all") return true;
    const comp = extractJoinObject(inst.computers) as {
      inventory_number: string | null;
      employees: { building: string | null } | { building: string | null }[] | null;
    } | null;
    const emp = comp ? extractJoinObject(comp.employees) : null;
    return emp && emp.building === buildingFilter;
  }).length;

  return (
    <div>
      <PageHeader
        title="Лицензии ПО"
        description={`${totalLicenses} лицензий · ${filteredInstallationsCount} активных установок`}
        actionNode={
          <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Добавить лицензию
          </Button>
        }
      />
      <LicensesClientView
        licenses={licenses}
        installations={installations}
        expiringLicenses={expiringLicenses}
        buildingFilter={buildingFilter}
        onBuildingFilterChange={handleBuildingChange}
      />
      <AddLicenseDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}