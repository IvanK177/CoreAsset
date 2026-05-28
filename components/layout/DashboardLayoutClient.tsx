"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import { Menu, X, MonitorIcon } from "lucide-react";

interface DashboardLayoutClientProps {
  openIncidents: number;
  expiringLicenses: number;
  attentionCount: number;
  userName?: string;
  children: React.ReactNode;
}

export default function DashboardLayoutClient({
  openIncidents,
  expiringLicenses,
  attentionCount,
  userName,
  children,
}: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row">
      {/* Mobile Top Navigation Header */}
      <header className="lg:hidden flex items-center justify-between px-4 h-16 bg-[#1a2035] text-white border-b border-white/10 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#2563eb]">
            <MonitorIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-xs tracking-tight text-white block">CoreAsset</span>
            <span className="text-[10px] text-gray-400 block leading-none">IT Management</span>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar container with mobile drawer */}
      <div 
        className={`fixed inset-0 z-50 lg:relative lg:z-auto transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto"
        }`}
      >
        {/* Backdrop for mobile */}
        <div 
          onClick={() => setSidebarOpen(false)}
          className={`absolute inset-0 bg-black/50 lg:hidden transition-opacity duration-300 ${
            sidebarOpen ? "opacity-100" : "opacity-0"
          }`} 
        />
        {/* Sidebar container */}
        <div 
          className={`absolute inset-y-0 left-0 w-[220px] transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar
            openIncidents={openIncidents}
            expiringLicenses={expiringLicenses}
            attentionCount={attentionCount}
            userName={userName}
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
