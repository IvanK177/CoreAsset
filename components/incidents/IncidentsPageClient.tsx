"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { IncidentsClientView } from "@/components/incidents/IncidentsClientView";
import { RoomRequestsAdminView } from "@/components/incidents/RoomRequestsAdminView";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const AddIncidentDialog = dynamic(
  () => import("@/components/incidents/AddIncidentDialog").then((mod) => mod.AddIncidentDialog),
  { ssr: false }
);
import type { Tables } from "@/types/database.types";

type Device = Pick<Tables<"devices">, "id" | "inventory_number" | "device_type" | "computer_type">;
type Employee = Pick<Tables<"employees">, "id" | "full_name" | "room">;

type IncidentStatus = "open" | "in_progress" | "resolved" | "cancelled";
type IncidentPriority = "low" | "medium" | "high" | "critical";

interface IncidentRow {
  id: string;
  title: string | null;
  description: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  created_at: string;
  incident_type: string;
  device_id: string | null;
  device: { id: string; inventory_number: string; device_type: string; computer_type: string | null } | null;
  employee: { id: string; full_name: string; position: string | null; room: string | null; building: string | null } | null;
  assignee?: { id: string; full_name: string | null } | null;
}

interface RoomRequestRow {
  id: string;
  room: string;
  type: string;
  description: string;
  status: string;
  author_id: string;
  created_at: string;
  employee: { id: string; full_name: string; position: string | null; room: string | null; building: string | null } | null;
}

interface IncidentsPageClientProps {
  incidents: IncidentRow[];
  roomRequests: RoomRequestRow[];
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  cancelledCount: number;
  devices: Device[];
  employees: Employee[];
  initialSelectedId?: string | null;
}

export function IncidentsPageClient({
  incidents,
  roomRequests,
  openCount,
  inProgressCount,
  resolvedCount,
  cancelledCount,
  devices,
  employees,
  initialSelectedId,
}: IncidentsPageClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<"it" | "aho">("it");

  return (
    <div>
      <PageHeader
        title={activeMainTab === "it" ? "Инциденты" : "Заявки АХЧ"}
        description={activeMainTab === "it" ? "Журнал всех заявок и технических неисправностей" : "Журнал заявок на ремонт и оснащение помещений"}
        actionNode={
          activeMainTab === "it" ? (
            <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Новый тикет
            </Button>
          ) : null
        }
      />

      {/* Main Tab Switcher */}
      <div className="flex border-b border-gray-200 mb-6 space-x-8">
        <button
          onClick={() => setActiveMainTab("it")}
          className={cn(
            "pb-4 text-sm font-semibold border-b-2 transition-all duration-150 relative -mb-[2px] cursor-pointer",
            activeMainTab === "it"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          Инциденты IT
        </button>
        <button
          onClick={() => setActiveMainTab("aho")}
          className={cn(
            "pb-4 text-sm font-semibold border-b-2 transition-all duration-150 relative -mb-[2px] cursor-pointer",
            activeMainTab === "aho"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          Заявки АХЧ
        </button>
      </div>

      {activeMainTab === "it" ? (
        <IncidentsClientView
          incidents={incidents}
          openCount={openCount}
          inProgressCount={inProgressCount}
          resolvedCount={resolvedCount}
          cancelledCount={cancelledCount}
          initialSelectedId={initialSelectedId}
        />
      ) : (
        <RoomRequestsAdminView requests={roomRequests} />
      )}

      <AddIncidentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        devices={devices}
        employees={employees}
      />
    </div>
  );
}