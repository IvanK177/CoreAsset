import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type ComputerStatus = "active" | "repair" | "decommissioned" | "storage";
type EmployeeStatus = "active" | "dismissed";
type IncidentStatus = "open" | "in_progress" | "resolved" | "cancelled";

const computerLabels: Record<ComputerStatus, string> = {
  active: "Активен",
  repair: "В ремонте",
  decommissioned: "Списан",
  storage: "На складе",
};

const computerColors: Record<ComputerStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  repair: "bg-orange-100 text-orange-700 border-orange-200",
  decommissioned: "bg-gray-100 text-gray-600 border-gray-200",
  storage: "bg-blue-100 text-blue-700 border-blue-200",
};

const employeeLabels: Record<EmployeeStatus, string> = {
  active: "Активен",
  dismissed: "Уволен",
};

const employeeColors: Record<EmployeeStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  dismissed: "bg-gray-100 text-gray-600 border-gray-200",
};

const incidentLabels: Record<IncidentStatus, string> = {
  open: "Открыт",
  in_progress: "В работе",
  resolved: "Исправлен",
  cancelled: "Отменён",
};

const incidentColors: Record<IncidentStatus, string> = {
  open: "bg-yellow-100 text-yellow-700 border-yellow-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

export function ComputerStatusBadge({ status }: { status: ComputerStatus }) {
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", computerColors[status])}>
      {computerLabels[status]}
    </Badge>
  );
}

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", employeeColors[status])}>
      {employeeLabels[status]}
    </Badge>
  );
}

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", incidentColors[status])}>
      {incidentLabels[status]}
    </Badge>
  );
}
