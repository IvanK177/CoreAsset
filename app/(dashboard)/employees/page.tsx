export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { EmployeesPageClient } from "@/components/employees/EmployeesPageClient";
import { getCachedEmployees, getCachedComputers, getCachedIncidents } from "@/lib/supabase/cached";

import type { Tables } from "@/types/database.types";

export default async function EmployeesPage() {
  const [employees, allComputers, incidents] = await Promise.all([
    getCachedEmployees(),
    getCachedComputers(),
    getCachedIncidents() as Promise<Tables<"incidents">[]>,
  ]);

  // Filter computers to only those assigned to an employee
  const assignedComputers = allComputers.filter((c) => c.employee_id !== null);

  return (
    <EmployeesPageClient
      employees={employees}
      computers={assignedComputers}
      incidents={incidents as unknown as Parameters<typeof EmployeesPageClient>[0]["incidents"]}
    />
  );
}
