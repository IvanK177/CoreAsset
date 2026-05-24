"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { ComputersClientView, ComputerWithEmployee, ActiveEmployee, LicensePoolOption } from "@/components/computers/ComputersClientView";
import { AddComputerDialog } from "@/components/computers/AddComputerDialog";

interface InstallRow {
  id: string;
  computer_id: string;
  software_id: string;
  installed_at: string;
  license_pool_id: string | null;
  software: unknown;
  license_pools: unknown;
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
  licensePools: LicensePoolOption[];
  totalCount: number;
  initialFilter?: string;
}

export function ComputersPageClient({
  computers,
  activeEmployees,
  installations,
  incidents,
  licensePools,
  totalCount,
  initialFilter = "all",
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
        licensePools={licensePools}
        initialFilter={initialFilter}
      />
      <AddComputerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}