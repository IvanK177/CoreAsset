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
  return (
    <div>
      <PageHeader
        title="Сотрудники"
        description={`${activeCount} активных, ${dismissedCount} уволенных`}
      />
      <EmployeesClientView
        employees={employees}
        computers={computers}
        incidents={incidents}
      />
    </div>
  );
}