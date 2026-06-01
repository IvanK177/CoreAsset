export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { IncidentsPageClient } from "@/components/incidents/IncidentsPageClient";
import { extractJoinObject } from "@/lib/utils";
import { getCachedIncidentsWithRelations, getCachedDevices, getCachedActiveEmployees, getCachedRoomRequests } from "@/lib/supabase/cached";

export default async function IncidentsPage({ searchParams }: { searchParams: Promise<{ selectedId?: string }> }) {
  const [allIncidents, devices, activeEmployees, roomRequests] = await Promise.all([
    getCachedIncidentsWithRelations(),
    getCachedDevices(),
    getCachedActiveEmployees(),
    getCachedRoomRequests(),
  ]);

  type RawIncident = Awaited<ReturnType<typeof getCachedIncidentsWithRelations>>[number];
  type RawRoomRequest = Awaited<ReturnType<typeof getCachedRoomRequests>>[number];

  // Count by status
  const openCount = allIncidents.filter((i: RawIncident) => i.status === "open").length;
  const inProgressCount = allIncidents.filter((i: RawIncident) => i.status === "in_progress").length;
  const resolvedCount = allIncidents.filter((i: RawIncident) => i.status === "resolved").length;
  const cancelledCount = allIncidents.filter((i: RawIncident) => i.status === "cancelled").length;

  // Normalize device and employee joins
  const normalizedIncidents = allIncidents.map((inc: RawIncident) => ({
    ...inc,
    priority: (inc.priority || "medium") as "low" | "medium" | "high" | "critical",
    status: (inc.status || "open") as "open" | "in_progress" | "resolved" | "cancelled",
    created_at: inc.created_at || new Date().toISOString(),
    incident_type: inc.incident_type || "other",
    device: extractJoinObject(inc.devices as unknown) as { id: string; inventory_number: string; device_type: string; computer_type: string | null } | null,
    employee: extractJoinObject(inc.employees as unknown) as { id: string; full_name: string; position: string | null; room: string | null; building: string | null } | null,
    assignee: extractJoinObject(inc.assignee as unknown) as { id: string; full_name: string | null } | null,
  }));

  const normalizedRoomRequests = roomRequests.map((req: RawRoomRequest) => ({
    ...req,
    employee: extractJoinObject(req.employees as unknown) as { id: string; full_name: string; position: string | null; room: string | null; building: string | null } | null,
  }));

  const { selectedId } = await searchParams;

  return (
    <IncidentsPageClient
      incidents={normalizedIncidents}
      roomRequests={normalizedRoomRequests}
      openCount={openCount}
      inProgressCount={inProgressCount}
      resolvedCount={resolvedCount}
      cancelledCount={cancelledCount}
      devices={devices}
      employees={activeEmployees}
      initialSelectedId={selectedId ?? null}
    />
  );
}

