"use client";

import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { EmployeesClientView } from "@/components/employees/EmployeesClientView";
import type { Tables } from "@/types/database.types";

type Employee = Tables<"employees">;

interface ComputerRow {
  id: string;
  inventory_number: string;
  computer_type: string | null;
  lifecycle_status: string;
  employee_id: string | null;
  room: string | null;
}

interface IncidentRow {
  id: string;
  title: string | null;
  computer_id: string | null;
  employee_id: string | null;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

interface EmployeesPageClientProps {
  employees: Employee[];
  computers: ComputerRow[];
  incidents: IncidentRow[];
}

export function EmployeesPageClient({
  employees,
  computers,
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
        computers={computers}
        incidents={incidents}
        buildingFilter={buildingFilter}
        onBuildingFilterChange={handleBuildingChange}
      />
    </div>
  );
}