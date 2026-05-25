export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { unstable_noStore as noStore } from 'next/cache';
import { createServiceClient } from "@/lib/supabase/server";
import { ComputersPageClient } from "@/components/computers/ComputersPageClient";
import type { ComputerWithEmployee, ActiveEmployee } from "@/components/computers/ComputersClientView";
import { extractJoinObject } from "@/lib/utils";
import type { Tables } from "@/types/database.types";

type Computer = Tables<"computers">;
type Employee = Tables<"employees">;

export default async function ComputersPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  noStore();
  const supabase = createServiceClient();

  const [computersRes, allEmployeesRes, activeEmployeesRes, installsRes, incidentsRes, licensesRes] = await Promise.all([
    supabase
      .from("computers")
      .select("*")
      .order("inventory_number"),
    supabase
      .from("employees")
      .select("*")
      .order("full_name"),
    supabase
      .from("employees")
      .select("id, full_name, position")
      .eq("is_active", true)
      .order("full_name"),
    supabase
      .from("computer_licenses")
      .select("id, computer_id, license_id, installed_at, licenses(id, software_name, version, license_type, total_seats, used_seats, price_per_unit, expires_at)")
      .order("installed_at", { ascending: false }),
    supabase
      .from("incidents")
      .select("id, computer_id, description, priority, status, incident_type, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("licenses")
      .select("id, software_name, used_seats, total_seats")
      .order("created_at", { ascending: false }),
  ]);

  const computers = computersRes.data ?? [];
  const allEmployees = allEmployeesRes.data ?? [];

  // Log any Supabase errors for debugging
  if (computersRes.error) {
    console.error("[ComputersPage] Computers query error:", computersRes.error.message);
  }
  if (allEmployeesRes.error) {
    console.error("[ComputersPage] All employees query error:", allEmployeesRes.error.message);
  }

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

  const activeEmployees = (activeEmployeesRes.data ?? []) as ActiveEmployee[];

  const { filter } = await searchParams;
  const validFilters = ["active", "repair", "storage", "decommissioned", "all"];
  const initialFilter = filter && validFilters.includes(filter) ? filter : "all";

  // Build license options for the Install Software dialog
  const rawLicenses = licensesRes.data ?? [];
  const licenseOptions = rawLicenses.map((l) => ({
    id: l.id,
    software_name: l.software_name ?? "—",
    used_seats: l.used_seats,
    total_seats: l.total_seats,
  }));

  // Normalize installations — extract joined license data
  const rawInstalls = installsRes.data ?? [];
  const installations = rawInstalls.map((inst) => ({
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
      incidents={incidentsRes.data ?? []}
      licenseOptions={licenseOptions}
      totalCount={computers.length}
      initialFilter={initialFilter}
    />
  );
}
