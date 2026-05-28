export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { IncidentsPageClient } from "@/components/incidents/IncidentsPageClient";
import { extractJoinObject } from "@/lib/utils";
import { getCachedIncidentsWithRelations, getCachedComputers, getCachedActiveEmployees } from "@/lib/supabase/cached";

export default async function IncidentsPage({ searchParams }: { searchParams: Promise<{ selectedId?: string }> }) {
  const [allIncidents, computers, activeEmployees] = await Promise.all([
    getCachedIncidentsWithRelations() as any,
    getCachedComputers(),
    getCachedActiveEmployees(),
  ]);

  // Count by status
  const openCount = allIncidents.filter((i: any) => i.status === "open").length;
  const inProgressCount = allIncidents.filter((i: any) => i.status === "in_progress").length;
  const resolvedCount = allIncidents.filter((i: any) => i.status === "resolved").length;
  const cancelledCount = allIncidents.filter((i: any) => i.status === "cancelled").length;

  // Normalize computer and employee joins
  const normalized = allIncidents.map((inc: any) => ({
    ...inc,
    computer: extractJoinObject(inc.computers as unknown) as { id: string; inventory_number: string } | null,
    employee: extractJoinObject(inc.employees as unknown) as { id: string; full_name: string; position: string | null; room: string | null } | null,
  }));

  const { selectedId } = await searchParams;

  return (
    <IncidentsPageClient
      incidents={normalized}
      openCount={openCount}
      inProgressCount={inProgressCount}
      resolvedCount={resolvedCount}
      cancelledCount={cancelledCount}
      computers={computers}
      employees={activeEmployees}
      initialSelectedId={selectedId ?? null}
    />
  );
}
