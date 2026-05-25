"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { LicensesClientView } from "@/components/licenses/LicensesClientView";
import { AddLicenseDialog } from "@/components/licenses/AddLicenseDialog";

interface LicenseRow {
  id: string;
  software_name: string;
  version: string | null;
  vendor: string | null;
  license_type: string;
  license_key: string | null;
  total_seats: number;
  used_seats: number;
  expires_at: string | null;
  price_per_unit: number | null;
  notes: string | null;
  created_at: string;
}

interface InstallationRow {
  id: string;
  computer_id: string;
  license_id: string;
  installed_at: string;
  computers: unknown;
}

interface LicensesPageClientProps {
  licenses: LicenseRow[];
  installations: InstallationRow[];
  expiringLicenses: LicenseRow[];
  totalLicenses: number;
  totalInstallations: number;
}

export function LicensesPageClient({
  licenses,
  installations,
  expiringLicenses,
  totalLicenses,
  totalInstallations,
}: LicensesPageClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Лицензии ПО"
        description={`${totalLicenses} лицензий · ${totalInstallations} активных установок`}
        actionNode={
          <Button size="sm" className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Добавить лицензию
          </Button>
        }
      />
      <LicensesClientView
        licenses={licenses}
        installations={installations}
        expiringLicenses={expiringLicenses}
      />
      <AddLicenseDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}