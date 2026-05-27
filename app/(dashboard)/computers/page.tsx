export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { ComputersPageClient } from "@/components/computers/ComputersPageClient";
import type { ComputerWithEmployee, ActiveEmployee } from "@/components/computers/ComputersClientView";
import { extractJoinObject } from "@/lib/utils";
import type { Tables } from "@/types/database.types";
import {
  getCachedComputers,
  getCachedEmployees,
  getCachedActiveEmployees,
  getCachedComputerLicenses,
  getCachedIncidents,
  getCachedLicenses,
  getCachedTemplates,
} from "@/lib/supabase/cached";

type Computer = Tables<"computers">;
type Employee = Tables<"employees">;

export default async function ComputersPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const [computers, allEmployees, activeEmployees, rawInstalls, incidents, rawLicenses, templates] = await Promise.all([
    getCachedComputers(),
    getCachedEmployees(),
    getCachedActiveEmployees() as Promise<ActiveEmployee[]>,
    getCachedComputerLicenses() as any,
    getCachedIncidents() as any,
    getCachedLicenses(),
    getCachedTemplates(),
  ]);

  // Build a map of computer_id -> employee for matching
  const employeeMap = new Map<string, Employee>();
  for (const e of allEmployees) {
    employeeMap.set(e.id, e);
  }

  // Enrich computers with employee data (using computers.employee_id directly)
  const computersWithEmployee: ComputerWithEmployee[] = computers.map((c) => {
    let employee: Employee | null = null;
    if (c.employee_id) {
      employee = employeeMap.get(c.employee_id) ?? null;
    }

    return {
      ...c,
      employees: employee ? {
        id: employee.id,
        full_name: employee.full_name,
        position: employee.position,
        email: employee.email,
        room: employee.room ?? null,
      } : null,
    };
  });

  const { filter } = await searchParams;
  const validFilters = ["active", "repair", "storage", "decommissioned", "all"];
  const initialFilter = filter && validFilters.includes(filter) ? filter : "all";

  // Build license options for the Install Software dialog
  const licenseOptions = rawLicenses.map((l) => ({
    id: l.id,
    software_name: l.software_name ?? "—",
    used_seats: l.used_seats,
    total_seats: l.total_seats,
  }));

  // Normalize installations — extract joined license data
  const installations = rawInstalls.map((inst: any) => ({
    id: inst.id,
    computer_id: inst.computer_id,
    license_id: inst.license_id,
    installed_at: inst.installed_at,
    licenses: extractJoinObject(inst.licenses as unknown) as { id: string; software_name: string; version: string | null; license_type: string; total_seats: number; used_seats: number; price_per_unit: number | null; expires_at: string | null } | null,
  }));

  return (
    <ComputersPageClient
      computers={computersWithEmployee}
      activeEmployees={activeEmployees}
      installations={installations}
      incidents={incidents}
      licenseOptions={licenseOptions}
      totalCount={computers.length}
      initialFilter={initialFilter}
      templates={templates}
    />
  );
}
