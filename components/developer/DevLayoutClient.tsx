"use client";

import { useState } from "react";
import DevSidebar from "../layout/DevSidebar";
import { Menu, X, MonitorIcon } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { EmployeeProfileData } from "@/components/portal/ProfileDialog";

interface DevLayoutClientProps {
  openRequests: number;
  userName?: string;
  employee?: EmployeeProfileData | null;
  children: React.ReactNode;
}

export default function DevLayoutClient({
  openRequests,
  userName,
  employee,
  children,
}: DevLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
      {/* Mobile Top Navigation Header */}
      <header className="lg:hidden flex items-center justify-between px-4 h-16 bg-[#1a2035] text-white border-b border-white/10 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600">
            <MonitorIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-xs tracking-tight text-white block">CoreAsset</span>
            <span className="text-[10px] text-gray-400 block leading-none">Портал Разработчиков</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle className="text-gray-400 hover:text-white hover:bg-white/10" />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Desktop Fixed Sidebar */}
      <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:w-[220px] lg:z-30">
        <DevSidebar
          openRequests={openRequests}
          userName={userName}
          employee={employee}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      <div 
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop for mobile */}
        <div 
          onClick={() => setSidebarOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            sidebarOpen ? "opacity-100" : "opacity-0"
          }`} 
        />
        {/* Sidebar container */}
        <div 
          className={`absolute inset-y-0 left-0 w-[220px] transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <DevSidebar
            openRequests={openRequests}
            userName={userName}
            employee={employee}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      {/* Main content container */}
      <main className="flex-1 w-full min-w-0 lg:pl-[220px]">
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
