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
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  repair: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  decommissioned: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  storage: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
};

const employeeLabels: Record<EmployeeStatus, string> = {
  active: "Активен",
  dismissed: "Уволен",
};

const employeeColors: Record<EmployeeStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  dismissed: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

const incidentLabels: Record<IncidentStatus, string> = {
  open: "Открыт",
  in_progress: "В работе",
  resolved: "Исправлен",
  cancelled: "Отменён",
};

const incidentColors: Record<IncidentStatus, string> = {
  open: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  in_progress: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  resolved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  cancelled: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

export function DeviceStatusBadge({ status }: { status: ComputerStatus }) {
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", computerColors[status])}>
      {computerLabels[status]}
    </Badge>
  );
}

export { DeviceStatusBadge as ComputerStatusBadge };

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
