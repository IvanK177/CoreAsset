import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: "default" | "green" | "amber" | "red" | "blue";
  href?: string;
}

const colorMap = {
  default: "bg-primary/10 text-primary",
  green: "bg-emerald-500/10 text-emerald-400",
  amber: "bg-amber-500/10 text-amber-400",
  red: "bg-rose-500/10 text-rose-400",
  blue: "bg-blue-500/10 text-blue-400",
};

export function StatCard({ label, value, icon: Icon, color = "default", href }: StatCardProps) {
  const card = (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 flex items-center gap-4 shadow-sm",
        href && "cursor-pointer hover:bg-muted/50 transition-colors"
      )}
    >
      <div className={cn("flex items-center justify-center w-11 h-11 rounded-xl", colorMap[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{card}</Link>;
  }

  return card;
}
