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

  const [computersRes, allEmployeesRes, activeEmployeesRes, installsRes, incidentsRes, workplacesRes, licensePoolsRes] = await Promise.all([
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
      .from("software_installations")
      .select("id, computer_id, software_id, installed_at, license_pool_id, software(id, name, version), license_pools(id, price_per_unit, expires_at, license_type, total_seats, used_seats)")
      .order("installed_at", { ascending: false }),
    supabase
      .from("incidents")
      .select("id, computer_id, description, priority, status, incident_type, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("workplaces")
      .select("id, computer_id, employee_id, room, assigned_at")
      .not("employee_id", "is", null),
    supabase
      .from("license_pools")
      .select("id, used_seats, total_seats, software(id, name)")
      .order("created_at", { ascending: false }),
  ]);

  const computers = computersRes.data ?? [];
  const allEmployees = allEmployeesRes.data ?? [];
  const workplaces = workplacesRes.data ?? [];

  // Log any Supabase errors for debugging
  if (computersRes.error) {
    console.error("[ComputersPage] Computers query error:", computersRes.error.message);
  }
  if (allEmployeesRes.error) {
    console.error("[ComputersPage] All employees query error:", allEmployeesRes.error.message);
  }
  if (workplacesRes.error) {
    console.error("[ComputersPage] Workplaces query error:", workplacesRes.error.message);
  }

  // Build a map of computer_id -> employee for matching
  const employeeMap = new Map<string, Employee>();
  for (const e of allEmployees) {
    employeeMap.set(e.id, e);
  }

  // Enrich computers with employee data
  const computersWithEmployee: ComputerWithEmployee[] = computers.map((c) => {
    // Try direct employee_id on computer (works after migration is applied)
    let employee: Employee | null = null;
    if ("employee_id" in c && c.employee_id) {
      employee = employeeMap.get(c.employee_id) ?? null;
    }

    // Fallback: find employee via workplaces (works before migration)
    if (!employee) {
      const wp = workplaces.find((w) => w.computer_id === c.id);
      if (wp?.employee_id) {
        employee = employeeMap.get(wp.employee_id) ?? null;
      }
    }

    return {
      ...c,
      employees: employee ? {
        id: employee.id,
        full_name: employee.full_name,
        position: employee.position,
        department: employee.department,
        email: employee.email,
      } : null,
    };
  });

  const activeEmployees = (activeEmployeesRes.data ?? []) as ActiveEmployee[];

  const { filter } = await searchParams;
  const validFilters = ["active", "repair", "storage", "decommissioned", "all"];
  const initialFilter = filter && validFilters.includes(filter) ? filter : "all";

  // Build license pool options for the Install Software dialog
  const rawLicensePools = licensePoolsRes.data ?? [];
  const licensePools = rawLicensePools.map((pool) => {
    const software = extractJoinObject(pool.software as unknown) as { id: string; name: string } | null;
    return {
      id: pool.id,
      software_name: software?.name ?? "—",
      used_seats: pool.used_seats,
      total_seats: pool.total_seats,
    };
  });

  return (
    <ComputersPageClient
      computers={computersWithEmployee}
      activeEmployees={activeEmployees}
      installations={installsRes.data ?? []}
      incidents={incidentsRes.data ?? []}
      licensePools={licensePools}
      totalCount={computers.length}
      initialFilter={initialFilter}
    />
  );
}
