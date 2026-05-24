"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { LicensesClientView } from "@/components/licenses/LicensesClientView";
import { AddLicensePoolDialog } from "@/components/licenses/AddLicensePoolDialog";

interface PoolRow {
  id: string;
  license_type: string;
  total_seats: number;
  used_seats: number;
  expires_at: string | null;
  price_per_unit: number;
  software_id: string;
  software: unknown;
}

interface InstallationRow {
  id: string;
  computer_id: string;
  installed_at: string;
  software_id: string;
  license_pool_id: string | null;
  computers: unknown;
}

interface LicensesPageClientProps {
  pools: PoolRow[];
  installations: InstallationRow[];
  expiringLicenses: PoolRow[];
  totalPools: number;
  totalInstallations: number;
}

export function LicensesPageClient({
  pools,
  installations,
  expiringLicenses,
  totalPools,
  totalInstallations,
}: LicensesPageClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Лицензии ПО"
        description={`${totalPools} пулов · ${totalInstallations} активных установок`}
        actionNode={
          <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Добавить пул
          </Button>
        }
      />
      <LicensesClientView
        pools={pools}
        installations={installations}
        expiringLicenses={expiringLicenses}
      />
      <AddLicensePoolDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}