"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { ComputersClientView, ComputerWithEmployee, ActiveEmployee, LicenseOption } from "@/components/computers/ComputersClientView";
import dynamic from "next/dynamic";

const AddComputerDialog = dynamic(
  () => import("@/components/computers/AddComputerDialog").then((mod) => mod.AddComputerDialog),
  { ssr: false }
);

import type { Tables } from "@/types/database.types";

interface InstallRow {
  id: string;
  computer_id: string;
  license_id: string;
  installed_at: string;
  licenses: unknown;
}

interface IncidentRow {
  id: string;
  computer_id: string | null;
  description: string;
  priority: string;
  status: string;
  incident_type: string;
  created_at: string;
}

interface ComputersPageClientProps {
  computers: ComputerWithEmployee[];
  activeEmployees: ActiveEmployee[];
  installations: InstallRow[];
  incidents: IncidentRow[];
  licenseOptions: LicenseOption[];
  totalCount: number;
  initialFilter?: string;
  templates: Tables<"computer_templates">[];
}

export function ComputersPageClient({
  computers,
  activeEmployees,
  installations,
  incidents,
  licenseOptions,
  totalCount,
  initialFilter = "all",
  templates,
}: ComputersPageClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Компьютеры"
        description={`${totalCount} устройств в реестре`}
        actionNode={
          <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Добавить ПК
          </Button>
        }
      />
      <ComputersClientView
        computers={computers}
        activeEmployees={activeEmployees}
        installations={installations}
        incidents={incidents}
        licenseOptions={licenseOptions}
        initialFilter={initialFilter}
        templates={templates}
      />
      <AddComputerDialog open={dialogOpen} onOpenChange={setDialogOpen} templates={templates} />
    </div>
  );
}