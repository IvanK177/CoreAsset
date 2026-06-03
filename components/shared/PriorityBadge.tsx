import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Priority = "low" | "medium" | "high" | "critical";

const labels: Record<Priority, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  critical: "Критический",
};

const colors: Record<Priority, string> = {
  low: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20",
  high: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
  critical: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", colors[priority])}>
      {labels[priority]}
    </Badge>
  );
}
