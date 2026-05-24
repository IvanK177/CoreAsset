export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { unstable_noStore as noStore } from 'next/cache';
import { createServiceClient } from "@/lib/supabase/server";
import { IncidentsPageClient } from "@/components/incidents/IncidentsPageClient";
import { extractJoinObject } from "@/lib/utils";

export default async function IncidentsPage({ searchParams }: { searchParams: Promise<{ selectedId?: string }> }) {
  noStore();
  const supabase = createServiceClient();

  const [incidentsRes, computersRes, employeesRes] = await Promise.all([
    supabase
      .from("incidents")
      .select("id, description, priority, status, created_at, incident_type, computer_id, employee_id, computers(id, inventory_number), employees(id, full_name, position)")
      .order("created_at", { ascending: false }),
    supabase
      .from("computers")
      .select("id, inventory_number")
      .order("inventory_number"),
    supabase
      .from("employees")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name"),
  ]);

  const allIncidents = incidentsRes.data ?? [];

  // Count by status
  const openCount = allIncidents.filter((i) => i.status === "open").length;
  const inProgressCount = allIncidents.filter((i) => i.status === "in_progress").length;
  const resolvedCount = allIncidents.filter((i) => i.status === "resolved").length;

  // Normalize computer and employee joins
  const normalized = allIncidents.map((inc) => ({
    ...inc,
    computer: extractJoinObject(inc.computers as unknown) as { id: string; inventory_number: string } | null,
    employee: extractJoinObject(inc.employees as unknown) as { id: string; full_name: string; position: string | null } | null,
  }));

  const { selectedId } = await searchParams;

  return (
    <IncidentsPageClient
      incidents={normalized}
      openCount={openCount}
      inProgressCount={inProgressCount}
      resolvedCount={resolvedCount}
      computers={computersRes.data ?? []}
      employees={employeesRes.data ?? []}
      initialSelectedId={selectedId ?? null}
    />
  );
}
