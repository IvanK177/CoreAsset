import Sidebar from "@/components/layout/Sidebar";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { daysUntilExpiry } from "@/lib/utils";

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
  const userEmail = userRes.data.user?.email;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar
        openIncidents={openIncidents}
        expiringLicenses={expiringLicenses}
        attentionCount={attentionCount}
        userEmail={userEmail}
      />
      <main className="pl-[220px]">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
