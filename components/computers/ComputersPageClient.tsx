"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { ComputersClientView, ComputerWithEmployee, ActiveEmployee, LicenseOption } from "@/components/computers/ComputersClientView";
import dynamic from "next/dynamic";

const AddComputerDialog = dynamic(
  () => import("@/components/computers/AddComputerDialog").then((mod) => mod.AddComputerDialog),
  { ssr: false }
);

import type { Tables } from "@/types/database.types";

interface InstallRow {
  id: string;
  computer_id: string | null;
  license_id: string | null;
  installed_at: string | null;
  licenses: unknown;
}

interface IncidentRow {
  id: string;
  computer_id: string | null;
  description: string;
  priority: string;
  status: string;
  incident_type: string;
  created_at: string;
}

interface ComputersPageClientProps {
  computers: ComputerWithEmployee[];
  activeEmployees: ActiveEmployee[];
  installations: InstallRow[];
  incidents: IncidentRow[];
  licenseOptions: LicenseOption[];
  initialFilter?: string;
  templates: Tables<"computer_templates">[];
}

export function ComputersPageClient({
  computers,
  activeEmployees,
  installations,
  incidents,
  licenseOptions,
  initialFilter = "all",
  templates,
}: ComputersPageClientProps) {
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

  const filteredCount = computers.filter((c) => {
    if (buildingFilter === "all") return true;
    const emp = Array.isArray(c.employees) ? c.employees[0] : c.employees;
    return emp && emp.building === buildingFilter;
  }).length;

  return (
    <div>
      <PageHeader
        title="Компьютеры"
        description={`${filteredCount} устройств в реестре`}
        actionNode={
          <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Добавить ПК
          </Button>
        }
      />
      <ComputersClientView
        computers={computers}
        activeEmployees={activeEmployees}
        installations={installations}
        incidents={incidents}
        licenseOptions={licenseOptions}
        initialFilter={initialFilter}
        templates={templates}
        buildingFilter={buildingFilter}
        onBuildingFilterChange={handleBuildingChange}
      />
      <AddComputerDialog open={dialogOpen} onOpenChange={setDialogOpen} templates={templates} />
    </div>
  );
}