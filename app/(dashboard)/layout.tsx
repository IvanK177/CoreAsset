import DashboardLayoutClient from "@/components/layout/DashboardLayoutClient";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { daysUntilExpiry } from "@/lib/utils";
import { cookies } from "next/headers";
import { RealtimeNotifications } from "@/components/shared/RealtimeNotifications";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Use regular client for auth (needs user JWT), service client for data (bypasses RLS)
  const authClient = await createClient();
  const dataClient = createServiceClient();

  // Fetch sidebar data
  const [incidentsRes, licensesRes, userRes] = await Promise.all([
    dataClient.from("incidents").select("id, priority, status").neq("status", "resolved"),
    dataClient
      .from("licenses")
      .select("id, expires_at")
      .eq("license_type", "subscription"),
    authClient.auth.getUser(),
  ]);

  const openIncidents = (incidentsRes.data ?? []).length;
  const criticalIncidents = (incidentsRes.data ?? []).filter(
    (i) => i.priority === "critical" || i.priority === "high"
  ).length;

  const expiringLicenses = (licensesRes.data ?? []).filter((l) => {
    const days = daysUntilExpiry(l.expires_at);
    return days !== null && days <= 30;
  }).length;

  const attentionCount = criticalIncidents + expiringLicenses;

  // Retrieve employee data for the profile section
  const cookieStore = await cookies();
  const demoEmployeeId = cookieStore.get("demo_employee_id")?.value;
  const user = userRes.data.user;

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
    // Fallback: try to find any admin in the database
    const { data } = await dataClient
      .from("employees")
      .select("id, full_name, email")
      .eq("role", "admin")
      .limit(1)
      .single();
    employeeData = data;
  }

  const userName = employeeData?.full_name || user?.email || "Администратор";

  return (
    <DashboardLayoutClient
      openIncidents={openIncidents}
      expiringLicenses={expiringLicenses}
      attentionCount={attentionCount}
      userName={userName}
    >
      <RealtimeNotifications role="admin" />
      {children}
    </DashboardLayoutClient>
  );
}
