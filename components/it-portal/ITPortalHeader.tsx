"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MonitorIcon, LogOut, TicketCheck, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";

interface ITPortalHeaderProps {
  specialistName: string;
  specialistPosition: string;
}

const navItems = [
  { href: "/it-portal", label: "Заявки", icon: ClipboardList },
  { href: "/it-portal/my-tasks", label: "Мои задачи", icon: TicketCheck },
];

export default function ITPortalHeader({ specialistName, specialistPosition }: ITPortalHeaderProps) {
  const pathname = usePathname();
  const firstName = specialistName.split(" ")[0] ?? specialistName;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600">
            <MonitorIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-gray-900">CoreAsset</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
              IT-портал
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/it-portal"
              ? pathname === "/it-portal"
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Specialist info + Logout */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-sm font-medium text-gray-900">{specialistName}</span>
          <span className="text-xs text-gray-500">{specialistPosition}</span>
        </div>
        <form action={signOut}>
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className="gap-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-2 sm:px-3"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Выйти</span>
          </Button>
        </form>
      </div>
    </header>
  );
}