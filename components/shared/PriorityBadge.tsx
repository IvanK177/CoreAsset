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
  low: "bg-gray-100 text-gray-600 border-gray-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  critical: "bg-red-100 text-red-700 border-red-200",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", colors[priority])}>
      {labels[priority]}
    </Badge>
  );
}
