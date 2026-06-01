"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  MonitorIcon,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";

interface FacilitiesSidebarProps {
  openRequests: number;
  userName?: string;
}

const nav = [
  { href: "/facilities-portal", label: "Заявки АХЧ", icon: ClipboardList },
];

export default function FacilitiesSidebar({ openRequests, userName }: FacilitiesSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-[220px] flex flex-col bg-[#1a2035] text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 shrink-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600">
          <MonitorIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-sm tracking-tight text-white">CoreAsset</span>
          <p className="text-xs text-gray-400 leading-tight">АХЧ Портал</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-emerald-600 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {openRequests > 0 && (
                <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold bg-emerald-500 text-white animate-pulse">
                  {openRequests}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Block */}
      <div className="px-3 py-3 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-600 text-white text-sm font-bold shrink-0">
            {userName ? userName.charAt(0).toUpperCase() : "А"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate" title={userName}>
              {userName ?? "Сотрудник АХЧ"}
            </p>
            <p className="text-xs text-gray-400">Сотрудник АХЧ</p>
          </div>
          <div className="flex items-center gap-1">
            <form action={signOut} className="inline">
              <button type="submit" className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  );
}
