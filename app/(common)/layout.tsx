import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { daysUntilExpiry } from "@/lib/utils";
import DashboardLayoutClient from "@/components/layout/DashboardLayoutClient";
import DevLayoutClient from "@/components/developer/DevLayoutClient";
import FacilitiesPortalHeader from "@/components/facilities/FacilitiesPortalHeader";
import ITPortalHeader from "@/components/it-portal/ITPortalHeader";
import PortalHeader from "@/components/portal/PortalHeader";
import { RealtimeNotifications } from "@/components/shared/RealtimeNotifications";

export default async function CommonLayout({ children }: { children: React.ReactNode }) {
  const authClient = await createClient();
  const dataClient = createServiceClient();
  const { data: { user } } = await authClient.auth.getUser();

  const cookieStore = await cookies();
  const demoRole = cookieStore.get("demo_role")?.value;
  const demoEmployeeId = cookieStore.get("demo_employee_id")?.value;

  let employeeData = null;
  let role = demoRole || "employee";

  const targetUserId = user?.id || demoEmployeeId;
  if (targetUserId) {
    const { data } = await dataClient
      .from("employees")
      .select("id, full_name, position, email, role, room, phone, telegram, building, avatar_url")
      .eq("id", targetUserId)
      .single();
    if (data) {
      employeeData = data;
      role = data.role || role;
    }
  }

  if (role === "admin") {
    const [incidentsRes, licensesRes] = await Promise.all([
      dataClient.from("incidents").select("id, priority, status").neq("status", "resolved"),
      dataClient
        .from("licenses")
        .select("id, expires_at")
        .eq("license_type", "subscription"),
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
    const userName = employeeData?.full_name || user?.email || "Администратор";

    return (
      <DashboardLayoutClient
        openIncidents={openIncidents}
        expiringLicenses={expiringLicenses}
        attentionCount={attentionCount}
        userName={userName}
        employee={employeeData}
      >
        <RealtimeNotifications role="admin" />
        {children}
      </DashboardLayoutClient>
    );
  }

  if (role === "developer") {
    const { data: requests } = await dataClient
      .from("support_requests")
      .select("id, status")
      .neq("status", "resolved");

    const openRequestsCount = (requests ?? []).length;
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

  if (role === "facilities") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <FacilitiesPortalHeader
          facilitiesName={employeeData?.full_name ?? "Сотрудник АХЧ"}
          facilitiesPosition={employeeData?.position ?? "Специалист АХЧ"}
          employee={employeeData}
        />
        <RealtimeNotifications role="facilities" />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    );
  }

  if (role === "it_specialist") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <ITPortalHeader
          specialistName={employeeData?.full_name ?? "IT-специалист"}
          specialistPosition={employeeData?.position ?? "IT-специалист"}
          employee={employeeData}
        />
        <RealtimeNotifications role="it_specialist" />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PortalHeader
        employeeName={employeeData?.full_name ?? "Сотрудник"}
        employeePosition={employeeData?.position ?? ""}
        employee={employeeData}
      />
      <main className="pt-16">
        <div className="max-w-4xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
