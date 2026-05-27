export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { EmployeesPageClient } from "@/components/employees/EmployeesPageClient";
import { getCachedEmployees, getCachedComputers, getCachedIncidents } from "@/lib/supabase/cached";

export default async function EmployeesPage() {
  const [employees, allComputers, incidents] = await Promise.all([
    getCachedEmployees(),
    getCachedComputers(),
    getCachedIncidents() as any,
  ]);

  const activeCount = employees.filter((e) => e.is_active).length;
  const dismissedCount = employees.filter((e) => !e.is_active).length;

  // Filter computers to only those assigned to an employee
  const assignedComputers = allComputers.filter((c) => c.employee_id !== null);

  return (
    <EmployeesPageClient
      employees={employees}
      computers={assignedComputers}
      incidents={incidents}
      activeCount={activeCount}
      dismissedCount={dismissedCount}
    />
  );
}
