import Link from "next/link";
import { LucideIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconTextColor?: string;
  href?: string;
}

export function StatCard({ label, value, subtitle, icon: Icon, iconBgColor, iconTextColor = "text-foreground", href }: StatCardProps) {
  const card = (
    <div
      className={cn(
        "rounded-xl bg-card border border-border/60 p-5 shadow-sm flex items-center gap-4 transition-all duration-300 ease-out",
        href && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-border/80 dark:hover:border-slate-800"
      )}
    >
      <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl transition-transform duration-300", iconBgColor)}>
        <Icon className={cn("w-5 h-5", iconTextColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="text-sm font-semibold text-foreground/90">{label}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {href && <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />}
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{card}</Link>;
  }

  return card;
}
