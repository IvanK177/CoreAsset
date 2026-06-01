"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Monitor,
  Users,
  Key,
  BarChart2,
  AlertTriangle,
  MonitorIcon,
  LogOut,
  Bell,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";

interface SidebarProps {
  openIncidents: number;
  expiringLicenses: number;
  attentionCount: number;
  userName?: string;
  onClose?: () => void;
}

const nav = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/devices", label: "Устройства", icon: Monitor },
  { href: "/templates", label: "Шаблоны", icon: ClipboardList },
  { href: "/employees", label: "Сотрудники", icon: Users },
  { href: "/licenses", label: "Лицензии", icon: Key },
  { href: "/finances", label: "Финансы", icon: BarChart2 },
  { href: "/incidents", label: "Инциденты", icon: AlertTriangle },
];

export default function Sidebar({ openIncidents, expiringLicenses, attentionCount, userName, onClose }: SidebarProps) {
  const pathname = usePathname();

  const getBadge = (href: string) => {
    if (href === "/licenses" && expiringLicenses > 0) return expiringLicenses;
    if (href === "/incidents" && openIncidents > 0) return openIncidents;
    return null;
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-[220px] flex flex-col bg-[#1a2035] text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 shrink-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#2563eb]">
          <MonitorIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-sm tracking-tight text-white">CoreAsset</span>
          <p className="text-xs text-gray-400 leading-tight">IT Asset Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard" || pathname === "/"
              : pathname.startsWith(href);
          const badge = getBadge(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={() => onClose?.()}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-[#2563eb] text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {badge !== null && (
                <span className={cn(
                  "ml-auto flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold",
                  href === "/licenses" ? "bg-red-500 text-white" : "bg-orange-500 text-white"
                )}>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Attention Banner */}
      {attentionCount > 0 && (
        <div className="px-3 pb-2">
          <Link
            href="/incidents"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
          >
            <Bell className="w-4 h-4 shrink-0" />
            {attentionCount} требуют внимания
          </Link>
        </div>
      )}

      {/* User Block */}
      <div className="px-3 py-3 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#2563eb] text-white text-sm font-bold shrink-0">
            {userName ? userName.charAt(0).toUpperCase() : "А"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate" title={userName}>
              {userName ?? "Администратор"}
            </p>
            <p className="text-xs text-gray-400">Администратор</p>
          </div>
          <div className="flex items-center gap-1">
            <form action={signOut} className="inline">
              <button type="submit" className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

    </aside>
  );
}
