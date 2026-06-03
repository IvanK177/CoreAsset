"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MonitorIcon, LogOut, ClipboardList, User, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { useState } from "react";
import { ProfileDialog } from "@/components/portal/ProfileDialog";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

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

interface FacilitiesPortalHeaderProps {
  facilitiesName: string;
  facilitiesPosition: string;
  employee?: EmployeeProfileData | null;
}

const navItems = [
  { href: "/facilities-portal", label: "Заявки АХЧ", icon: ClipboardList },
  { href: "/support", label: "Поддержка", icon: HelpCircle },
];

export default function FacilitiesPortalHeader({
  facilitiesName,
  facilitiesPosition,
  employee,
}: FacilitiesPortalHeaderProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-between px-3 sm:px-6 bg-card border-b border-border">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600">
            <MonitorIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-foreground">CoreAsset</span>
            <span className="hidden xs:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
              АХЧ Портал
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: User info + Theme Toggle + Profile + Logout */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-sm font-medium text-foreground">{facilitiesName}</span>
          <span className="text-xs text-muted-foreground">{facilitiesPosition}</span>
        </div>

        <ThemeToggle />

        {employee && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setProfileOpen(true)}
            className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted px-2 sm:px-3 cursor-pointer h-9 rounded-lg"
          >
            {employee.avatar_url ? (
              <img
                src={employee.avatar_url}
                alt={facilitiesName}
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
            className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted px-2 sm:px-3 h-9 rounded-lg"
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
