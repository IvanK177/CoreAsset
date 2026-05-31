"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { DevicesClientView, DeviceWithEmployee, ActiveEmployee, LicenseOption } from "@/components/devices/DevicesClientView";
import dynamic from "next/dynamic";

const AddDeviceDialog = dynamic(
  () => import("@/components/devices/AddDeviceDialog").then((mod) => mod.AddDeviceDialog),
  { ssr: false }
);

import type { Tables } from "@/types/database.types";

interface InstallRow {
  id: string;
  device_id: string | null;
  license_id: string | null;
  installed_at: string | null;
  licenses: unknown;
}

interface IncidentRow {
  id: string;
  device_id: string | null;
  description: string;
  priority: string;
  status: string;
  incident_type: string;
  created_at: string;
}

interface DevicesPageClientProps {
  devices: DeviceWithEmployee[];
  activeEmployees: ActiveEmployee[];
  installations: InstallRow[];
  incidents: IncidentRow[];
  licenseOptions: LicenseOption[];
  initialFilter?: string;
  templates: Tables<"computer_templates">[];
}

export function DevicesPageClient({
  devices,
  activeEmployees,
  installations,
  incidents,
  licenseOptions,
  initialFilter = "all",
  templates,
}: DevicesPageClientProps) {
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

  const filteredCount = devices.filter((d) => {
    if (buildingFilter === "all") return true;
    const emp = Array.isArray(d.employees) ? d.employees[0] : d.employees;
    return emp && emp.building === buildingFilter;
  }).length;

  return (
    <div>
      <PageHeader
        title="Устройства"
        description={`${filteredCount} устройств в реестре`}
        actionNode={
          <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Добавить устройство
          </Button>
        }
      />
      <DevicesClientView
        devices={devices}
        activeEmployees={activeEmployees}
        installations={installations}
        incidents={incidents}
        licenseOptions={licenseOptions}
        initialFilter={initialFilter}
        templates={templates}
        buildingFilter={buildingFilter}
        onBuildingFilterChange={handleBuildingChange}
      />
      <AddDeviceDialog open={dialogOpen} onOpenChange={setDialogOpen} templates={templates} />
    </div>
  );
}