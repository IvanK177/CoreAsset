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

export function StatCard({ label, value, subtitle, icon: Icon, iconBgColor, iconTextColor = "text-gray-700", href }: StatCardProps) {
  const card = (
    <div
      className={cn(
        "rounded-xl bg-white p-5 shadow-sm flex items-center gap-4",
        href && "cursor-pointer hover:shadow-md transition-shadow"
      )}
    >
      <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg", iconBgColor)}>
        <Icon className={cn("w-5 h-5", iconTextColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-3xl font-bold tracking-tight text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      {href && <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />}
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{card}</Link>;
  }

  return card;
}
