"use client";

import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { EmployeesClientView } from "@/components/employees/EmployeesClientView";
import type { Tables } from "@/types/database.types";

type Employee = Tables<"employees">;

interface DeviceRow {
  id: string;
  inventory_number: string;
  computer_type: string | null; // DB column name used as Subtype/Model name
  lifecycle_status: string;
  employee_id: string | null;
  room: string | null;
  device_type: string;
}

interface IncidentRow {
  id: string;
  title: string | null;
  device_id: string | null;
  employee_id: string | null;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

interface EmployeesPageClientProps {
  employees: Employee[];
  devices: DeviceRow[];
  incidents: IncidentRow[];
}

export function EmployeesPageClient({
  employees,
  devices,
  incidents,
}: EmployeesPageClientProps) {
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

  const filteredEmployees = employees.filter(
    (e) => buildingFilter === "all" || e.building === buildingFilter
  );

  const activeFiltered = filteredEmployees.filter((e) => e.is_active).length;
  const dismissedFiltered = filteredEmployees.filter((e) => !e.is_active).length;

  return (
    <div>
      <PageHeader
        title="Сотрудники"
        description={`${activeFiltered} активных, ${dismissedFiltered} уволенных`}
      />
      <EmployeesClientView
        employees={employees}
        devices={devices}
        incidents={incidents}
        buildingFilter={buildingFilter}
        onBuildingFilterChange={handleBuildingChange}
      />
    </div>
  );
}