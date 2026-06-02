import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import DevLayoutClient from "@/components/developer/DevLayoutClient";
import { RealtimeNotifications } from "@/components/shared/RealtimeNotifications";

export default async function DeveloperPortalLayout({ children }: { children: React.ReactNode }) {
  const authClient = await createClient();
  const dataClient = createServiceClient();

  const [requestsRes, userRes] = await Promise.all([
    dataClient.from("support_requests").select("id, status").neq("status", "resolved"),
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
      .select("id, full_name, position, email, phone, telegram, room, building, avatar_url")
      .eq("id", user.id)
      .single();
    employeeData = data;
  }

  if (!employeeData && demoEmployeeId) {
    const { data } = await dataClient
      .from("employees")
      .select("id, full_name, position, email, phone, telegram, room, building, avatar_url")
      .eq("id", demoEmployeeId)
      .single();
    employeeData = data;
  }

  if (!employeeData) {
    const { data } = await dataClient
      .from("employees")
      .select("id, full_name, position, email, phone, telegram, room, building, avatar_url")
      .eq("role", "developer")
      .eq("is_active", true)
      .limit(1)
      .single();
    employeeData = data;
  }

  const userName = employeeData?.full_name || user?.email || "Разработчик";

  return (
    <DevLayoutClient
      openRequests={openRequestsCount}
      userName={userName}
      employee={employeeData}
    >
      <RealtimeNotifications role="developer" />
      {children}
    </DevLayoutClient>
  );
}
