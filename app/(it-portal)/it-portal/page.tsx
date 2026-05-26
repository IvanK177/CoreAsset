export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import ITPortalClientView from "@/components/it-portal/ITPortalClientView";

interface RelatedEmployee {
  full_name: string | null;
}

interface RelatedComputer {
  inventory_number: string | null;
  computer_type: string | null;
}

interface IncidentRow {
  id: string;
  title: string | null;
  description: string;
  priority: string;
  status: string;
  incident_type: string;
  created_at: string;
  resolved_at: string | null;
  assigned_to: string | null;
  employee: RelatedEmployee | RelatedEmployee[] | null;
  computer: RelatedComputer | RelatedComputer[] | null;
}

export default async function ITPortalPage() {
  const authClient = await createClient();
  const dataClient = createServiceClient();

  // Get specialist ID from demo cookie or auth
  const cookieStore = await cookies();
  const demoEmployeeId = cookieStore.get("demo_employee_id")?.value;

  let specialistId: string | undefined = demoEmployeeId;

  if (!specialistId) {
    const { data: { user } } = await authClient.auth.getUser();
    if (user?.email) {
      const { data } = await dataClient
        .from("employees")
        .select("id")
        .eq("email", user.email)
        .single();
      specialistId = data?.id;
    }
  }

  // Fallback: find any active IT specialist
  if (!specialistId) {
    const { data } = await dataClient
      .from("employees")
      .select("id")
      .eq("role", "it_specialist")
      .eq("is_active", true)
      .limit(1)
      .single();
    specialistId = data?.id;
  }

  // Fetch ALL incidents with related data (author name + computer info)
  const { data: incidents, error: incidentsError } = await dataClient
    .from("incidents")
    .select(`
      id,
      title,
      description,
      priority,
      status,
      incident_type,
      created_at,
      resolved_at,
      assigned_to,
      employee:employees!incidents_employee_id_fkey(full_name),
      computer:computers!incidents_computer_id_fkey(inventory_number, computer_type)
    `)
    .order("created_at", { ascending: false });

  if (incidentsError) {
    console.error("[ITPortalPage] Supabase query error:", incidentsError.code, incidentsError.message);
  }

  // Count stats
  const allIncidents: IncidentRow[] = (incidents as IncidentRow[]) ?? [];
  const openCount = allIncidents.filter((i) => i.status === "open").length;
  const inProgressCount = allIncidents.filter((i) => i.status === "in_progress").length;
  const resolvedCount = allIncidents.filter((i) => i.status === "resolved").length;

  return (
    <ITPortalClientView
      specialistId={specialistId ?? ""}
      incidents={allIncidents}
      openCount={openCount}
      inProgressCount={inProgressCount}
      resolvedCount={resolvedCount}
      currentPath="/it-portal"
    />
  );
}