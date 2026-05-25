"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { EmployeesClientView } from "@/components/employees/EmployeesClientView";
import { AddEmployeeDialog } from "@/components/employees/AddEmployeeDialog";
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
  activeCount: number;
  dismissedCount: number;
}

export function EmployeesPageClient({
  employees,
  computers,
  incidents,
  activeCount,
  dismissedCount,
}: EmployeesPageClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Сотрудники"
        description={`${activeCount} активных, ${dismissedCount} уволенных`}
        actionNode={
          <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Добавить сотрудника
          </Button>
        }
      />
      <EmployeesClientView
        employees={employees}
        computers={computers}
        incidents={incidents}
      />
      <AddEmployeeDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}