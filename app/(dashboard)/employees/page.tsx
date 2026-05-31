export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { EmployeesPageClient } from "@/components/employees/EmployeesPageClient";
import { getCachedEmployees, getCachedDevices, getCachedIncidents } from "@/lib/supabase/cached";
import type { Tables } from "@/types/database.types";

export default async function EmployeesPage() {
  const [employees, allDevices, incidents] = await Promise.all([
    getCachedEmployees(),
    getCachedDevices(),
    getCachedIncidents() as Promise<Tables<"incidents">[]>,
  ]);

  // Filter devices to only those assigned to an employee
  const assignedDevices = allDevices
    .filter((d) => d.employee_id !== null)
    .map((d) => ({
      ...d,
      lifecycle_status: d.lifecycle_status || "storage",
    }));

  return (
    <EmployeesPageClient
      employees={employees}
      devices={assignedDevices}
      incidents={incidents as unknown as Parameters<typeof EmployeesPageClient>[0]["incidents"]}
    />
  );
}
