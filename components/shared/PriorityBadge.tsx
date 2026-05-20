import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Priority = "low" | "medium" | "high" | "critical";

const labels: Record<Priority, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  critical: "Критичный",
};

const colors: Record<Priority, string> = {
  low: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  medium: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  high: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  critical: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", colors[priority])}>
      {labels[priority]}
    </Badge>
  );
}
