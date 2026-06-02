"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, MonitorIcon, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ProfileDialog, EmployeeProfileData } from "@/components/portal/ProfileDialog";

interface DevSidebarProps {
  openRequests: number;
  userName?: string;
  employee?: EmployeeProfileData | null;
}

const nav = [
  { href: "/dev-portal", label: "Портал Разработчика", icon: ClipboardList },
];

export default function DevSidebar({ openRequests, userName, employee }: DevSidebarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-[220px] flex flex-col bg-[#1a2035] text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 shrink-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600">
          <MonitorIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-sm tracking-tight text-white">CoreAsset</span>
          <p className="text-xs text-gray-400 leading-tight">Портал Разработчиков</p>
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
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {openRequests > 0 && (
                <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold bg-indigo-500 text-white animate-pulse">
                  {openRequests}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Block */}
      <div className="px-4 py-3.5 border-t border-white/10 bg-white/5">
        <div 
          onClick={() => employee && setProfileOpen(true)}
          className={cn(
            "flex items-start gap-3 p-1 -mx-1 rounded-md transition-colors",
            employee && "cursor-pointer hover:bg-white/10"
          )}
          title={employee ? "Настройки профиля" : undefined}
        >
          {employee?.avatar_url ? (
            <img
              src={employee.avatar_url}
              alt={userName}
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-600 text-white text-sm font-bold shrink-0">
              {userName ? userName.charAt(0).toUpperCase() : "Р"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 leading-none mb-1">Разработчик</p>
            <p className="text-sm font-medium text-white break-words leading-tight" title={userName}>
              {userName ?? "Разработчик"}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-white/5">
          <ThemeToggle className="text-gray-400 hover:text-white hover:bg-white/10 h-8 w-8 rounded-lg" />
          <form action={signOut} className="inline flex items-center">
            <button type="submit" className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer" title="Выйти">
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {employee && (
        <ProfileDialog
          open={profileOpen}
          onOpenChange={setProfileOpen}
          employee={employee}
        />
      )}
    </aside>
  );
}
