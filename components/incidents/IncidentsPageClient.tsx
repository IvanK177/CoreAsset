"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { IncidentsClientView } from "@/components/incidents/IncidentsClientView";
import dynamic from "next/dynamic";

const AddIncidentDialog = dynamic(
  () => import("@/components/incidents/AddIncidentDialog").then((mod) => mod.AddIncidentDialog),
  { ssr: false }
);
import type { Tables } from "@/types/database.types";

type Computer = Pick<Tables<"computers">, "id" | "inventory_number">;
type Employee = Pick<Tables<"employees">, "id" | "full_name" | "room">;

type IncidentStatus = "open" | "in_progress" | "resolved";
type IncidentPriority = "low" | "medium" | "high" | "critical";

interface IncidentRow {
  id: string;
  description: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  created_at: string;
  incident_type: string;
  computer_id: string | null;
  computer: { id: string; inventory_number: string } | null;
  employee: { id: string; full_name: string; position: string | null; room: string | null } | null;
}

interface IncidentsPageClientProps {
  incidents: IncidentRow[];
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  computers: Computer[];
  employees: Employee[];
  initialSelectedId?: string | null;
}

export function IncidentsPageClient({
  incidents,
  openCount,
  inProgressCount,
  resolvedCount,
  computers,
  employees,
  initialSelectedId,
}: IncidentsPageClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Инциденты"
        description="Журнал всех заявок и технических неисправностей"
        actionNode={
          <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Новый тикет
          </Button>
        }
      />
      <IncidentsClientView
        incidents={incidents}
        openCount={openCount}
        inProgressCount={inProgressCount}
        resolvedCount={resolvedCount}
        initialSelectedId={initialSelectedId}
      />
      <AddIncidentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        computers={computers}
        employees={employees}
      />
    </div>
  );
}