"use client";

import { MonitorIcon, LogOut, User, ClipboardList, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { useState } from "react";
import { ProfileDialog } from "@/components/portal/ProfileDialog";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface EmployeeProfileData {
  id: string;
  full_name: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  telegram: string | null;
  room: string | null;
  building: string | null;
  avatar_url?: string | null;
}

interface PortalHeaderProps {
  employeeName: string;
  employeePosition: string;
  employee?: EmployeeProfileData | null;
}

export default function PortalHeader({ employeeName, employeePosition, employee }: PortalHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-between px-3 sm:px-6 bg-white border-b border-gray-200">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#2563eb]">
            <MonitorIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-gray-900">CoreAsset</span>
            <span className="hidden xs:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
              Портал сотрудника
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex items-center gap-1">
          <Link
            href="/portal"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
              pathname === "/portal" || pathname.startsWith("/portal/")
                ? "bg-blue-50 text-blue-700"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            )}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Мой портал</span>
          </Link>
          <Link
            href="/support"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
              pathname === "/support"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            )}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Поддержка</span>
          </Link>
        </nav>
      </div>

      {/* Right: Employee info + Theme Toggle + Profile + Logout */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-gray-900">{employeeName}</span>
          <span className="text-xs text-gray-500">{employeePosition}</span>
        </div>

        <ThemeToggle />

        {employee && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setProfileOpen(true)}
            className="gap-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-2 sm:px-3 cursor-pointer h-9 rounded-lg"
          >
            {employee.avatar_url ? (
              <img
                src={employee.avatar_url}
                alt={employeeName}
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
            ) : (
              <User className="w-4 h-4 shrink-0" />
            )}
            <span className="hidden sm:inline">Профиль</span>
          </Button>
        )}

        <form action={signOut}>
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className="gap-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-2 sm:px-3 cursor-pointer h-9 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Выйти</span>
          </Button>
        </form>
      </div>

      {employee && (
        <ProfileDialog
          open={profileOpen}
          onOpenChange={setProfileOpen}
          employee={employee}
        />
      )}
    </header>
  );
}