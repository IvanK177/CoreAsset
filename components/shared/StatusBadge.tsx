import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type ComputerStatus = "active" | "repair" | "decommissioned" | "storage";
type IncidentStatus = "open" | "in_progress" | "resolved";

const computerLabels: Record<ComputerStatus, string> = {
  active: "Активен",
  repair: "В ремонте",
  decommissioned: "Списан",
  storage: "Склад",
};

const computerColors: Record<ComputerStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  repair: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  decommissioned: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  storage: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const incidentLabels: Record<IncidentStatus, string> = {
  open: "Открыт",
  in_progress: "В работе",
  resolved: "Исправлен",
};

const incidentColors: Record<IncidentStatus, string> = {
  open: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  in_progress: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export function ComputerStatusBadge({ status }: { status: ComputerStatus }) {
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", computerColors[status])}>
      {computerLabels[status]}
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
