import { AlertTriangle } from "lucide-react";
import Link from "next/link";

interface AlertItem {
  id: string;
  label: string;
  href: string;
}

interface AlertBannerProps {
  title: string;
  items: AlertItem[];
  variant?: "critical" | "warning";
}

export function AlertBanner({ title, items, variant = "warning" }: AlertBannerProps) {
  if (items.length === 0) return null;

  const styles =
    variant === "critical"
      ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
      : "bg-amber-500/10 border-amber-500/30 text-amber-400";

  return (
    <div className={`rounded-xl border px-4 py-3 ${styles}`}>
      <div className="flex items-center gap-2 mb-2 font-medium text-sm">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        {title}
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className="text-sm underline underline-offset-2 opacity-80 hover:opacity-100">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
