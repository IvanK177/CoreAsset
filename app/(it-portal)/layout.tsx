import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import ITPortalHeader from "@/components/it-portal/ITPortalHeader";
import { RealtimeNotifications } from "@/components/shared/RealtimeNotifications";

export default async function ITPortalLayout({ children }: { children: React.ReactNode }) {
  const authClient = await createClient();
  const dataClient = createServiceClient();
  const { data: { user } } = await authClient.auth.getUser();

  const cookieStore = await cookies();
  const demoRole = cookieStore.get("demo_role")?.value;
  const demoEmployeeId = cookieStore.get("demo_employee_id")?.value;

  // Get IT specialist employee data — prefer user.id match (trigger-synced), then demo cookie, then fallback
  let employeeData = null;

  if (user?.id) {
    // Primary: match by user.id (auth.users.id → employees.id via trigger)
    const { data } = await dataClient
      .from("employees")
      .select("id, full_name, position, email, role")
      .eq("id", user.id)
      .single();
    employeeData = data;
  }

  if (!employeeData && demoEmployeeId) {
    // Demo mode: use demo cookie employee ID
    const { data } = await dataClient
      .from("employees")
      .select("id, full_name, position, email, role")
      .eq("id", demoEmployeeId)
      .single();
    employeeData = data;
  }

  // Fallback: find any active IT specialist
  if (!employeeData) {
    const { data } = await dataClient
      .from("employees")
      .select("id, full_name, position, email, role")
      .eq("role", "it_specialist")
      .eq("is_active", true)
      .limit(1)
      .single();
    employeeData = data;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <ITPortalHeader
        specialistName={employeeData?.full_name ?? "IT-специалист"}
        specialistPosition={employeeData?.position ?? "IT-специалист"}
      />
      <RealtimeNotifications role="it_specialist" />
      <main className="pt-16">
        <div className="max-w-5xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}