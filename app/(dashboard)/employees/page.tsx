export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { unstable_noStore as noStore } from 'next/cache';
import { createServiceClient } from "@/lib/supabase/server";
import { EmployeesPageClient } from "@/components/employees/EmployeesPageClient";

export default async function EmployeesPage() {
  noStore();
  const supabase = createServiceClient();

  const [employeesRes, computersRes, incidentsRes] = await Promise.all([
    supabase.from("employees").select("*").order("full_name"),
    supabase
      .from("computers")
      .select("id, inventory_number, computer_type, lifecycle_status, employee_id, room")
      .not("employee_id", "is", null),
    supabase
      .from("incidents")
      .select("id, title, description, priority, status, created_at, computer_id, employee_id")
      .order("created_at", { ascending: false }),
  ]);

  const employees = employeesRes.data ?? [];
  const activeCount = employees.filter((e) => e.is_active).length;
  const dismissedCount = employees.filter((e) => !e.is_active).length;

  return (
    <EmployeesPageClient
      employees={employees}
      computers={computersRes.data ?? []}
      incidents={incidentsRes.data ?? []}
      activeCount={activeCount}
      dismissedCount={dismissedCount}
    />
  );
}
