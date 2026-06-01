import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import FacilitiesLayoutClient from "@/components/facilities/FacilitiesLayoutClient";
import { RealtimeNotifications } from "@/components/shared/RealtimeNotifications";

export default async function FacilitiesPortalLayout({ children }: { children: React.ReactNode }) {
  const authClient = await createClient();
  const dataClient = createServiceClient();

  const [requestsRes, userRes] = await Promise.all([
    dataClient.from("room_requests").select("id, status").neq("status", "resolved"),
    authClient.auth.getUser(),
  ]);

  const openRequestsCount = (requestsRes.data ?? []).length;
  const user = userRes.data.user;

  const cookieStore = await cookies();
  const demoEmployeeId = cookieStore.get("demo_employee_id")?.value;

  let employeeData = null;

  if (user?.id) {
    const { data } = await dataClient
      .from("employees")
      .select("id, full_name, email")
      .eq("id", user.id)
      .single();
    employeeData = data;
  }

  if (!employeeData && demoEmployeeId) {
    const { data } = await dataClient
      .from("employees")
      .select("id, full_name, email")
      .eq("id", demoEmployeeId)
      .single();
    employeeData = data;
  }

  if (!employeeData) {
    const { data } = await dataClient
      .from("employees")
      .select("id, full_name, email")
      .eq("role", "facilities")
      .eq("is_active", true)
      .limit(1)
      .single();
    employeeData = data;
  }

  const userName = employeeData?.full_name || user?.email || "Сотрудник АХЧ";

  return (
    <FacilitiesLayoutClient
      openRequests={openRequestsCount}
      userName={userName}
    >
      <RealtimeNotifications role="facilities" />
      {children}
    </FacilitiesLayoutClient>
  );
}
