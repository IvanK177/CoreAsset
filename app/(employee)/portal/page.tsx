export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import PortalClientView from "@/components/portal/PortalClientView";
import { Message } from "@/components/TicketChat";

export default async function PortalPage() {
  const authClient = await createClient();
  const dataClient = createServiceClient();

  // Get demo employee ID from cookies
  const cookieStore = await cookies();
  const demoEmployeeId = cookieStore.get("demo_employee_id")?.value;

  // Determine employee ID — from demo cookie or from auth user email match
  let employeeId = demoEmployeeId;

  if (!employeeId) {
    const { data: { user } } = await authClient.auth.getUser();
    if (user?.email) {
      const { data } = await dataClient
        .from("employees")
        .select("id")
        .eq("email", user.email)
        .single();
      employeeId = data?.id;
    }
  }

  // Fallback to hardcoded demo employee
  if (!employeeId) {
    employeeId = "e0000001-0000-0000-0000-000000000001";
  }

  // Fetch employee data
  const { data: employee } = await dataClient
    .from("employees")
    .select("id, full_name, position, email, room")
    .eq("id", employeeId)
    .single();

  // Fetch devices assigned to this employee
  const { data: devices } = await dataClient
    .from("devices")
    .select("id, inventory_number, computer_type, lifecycle_status, room, hardware, employee_id, device_type")
    .eq("employee_id", employeeId);

  // Fetch incidents created by this employee
  const { data: incidents } = await dataClient
    .from("incidents")
    .select(`
      id,
      title,
      description,
      priority,
      status,
      incident_type,
      created_at,
      device_id,
      photo_urls,
      resolution,
      device:devices!incidents_device_id_fkey(inventory_number, computer_type, device_type),
      assignee:employees!incidents_assigned_to_fkey(full_name)
    `)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  // Fetch messages for these incidents
  const incidentIds = (incidents ?? []).map((i) => i.id);
  const { data: rawMessages } = await dataClient
    .from("incident_messages")
    .select("*, sender:employees!incident_messages_sender_id_fkey(full_name)")
    .in("incident_id", incidentIds)
    .order("created_at", { ascending: true });

  const initialMessagesMap: Record<string, Message[]> = {};
  (rawMessages ?? []).forEach((msg) => {
    if (!initialMessagesMap[msg.incident_id]) {
      initialMessagesMap[msg.incident_id] = [];
    }
    initialMessagesMap[msg.incident_id].push(msg);
  });

  // Fetch room requests created by this employee
  const { data: roomRequests } = await dataClient
    .from("room_requests")
    .select(`
      id,
      room,
      type,
      description,
      status,
      created_at
    `)
    .eq("author_id", employeeId)
    .order("created_at", { ascending: false });

  // Calculate stats
  const activeIT = (incidents ?? []).filter(
    (i) => i.status === "open" || i.status === "in_progress"
  ).length;
  const activeAHO = (roomRequests ?? []).filter(
    (r) => r.status === "open" || r.status === "in_progress"
  ).length;
  const openIncidents = activeIT + activeAHO;

  const resolvedIT = (incidents ?? []).filter(
    (i) => i.status === "resolved"
  ).length;
  const resolvedAHO = (roomRequests ?? []).filter(
    (r) => r.status === "resolved"
  ).length;
  const resolvedIncidents = resolvedIT + resolvedAHO;

  const normalizedDevices = (devices ?? []).map((d) => ({
    ...d,
    lifecycle_status: d.lifecycle_status || "storage",
  }));

  const normalizedIncidents = (incidents ?? []).map((inc) => ({
    ...inc,
    title: inc.title || "",
    description: inc.description || "",
    priority: inc.priority || "medium",
    status: inc.status || "open",
    incident_type: inc.incident_type || "other",
    created_at: inc.created_at || new Date().toISOString(),
  }));

  return (
    <PortalClientView
      employeeId={employeeId}
      employeeName={employee?.full_name ?? "Сотрудник"}
      employeePosition={employee?.position ?? ""}
      devices={normalizedDevices}
      incidents={normalizedIncidents}
      roomRequests={roomRequests ?? []}
      openIncidents={openIncidents}
      resolvedIncidents={resolvedIncidents}
      initialMessagesMap={initialMessagesMap}
    />
  );
}