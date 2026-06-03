import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import ITPortalHeader from "@/components/it-portal/ITPortalHeader";
import { RealtimeNotifications } from "@/components/shared/RealtimeNotifications";

export default async function ITPortalLayout({ children }: { children: React.ReactNode }) {
  const authClient = await createClient();
  const dataClient = createServiceClient();
  const { data: { user } } = await authClient.auth.getUser();

  const cookieStore = await cookies();

  const demoEmployeeId = cookieStore.get("demo_employee_id")?.value;

  // Get IT specialist employee data — prefer user.id match (trigger-synced), then demo cookie, then fallback
  let employeeData = null;

  if (user?.id) {
    // Primary: match by user.id (auth.users.id → employees.id via trigger)
    const { data } = await dataClient
      .from("employees")
      .select("id, full_name, position, email, role, room, phone, telegram, building, avatar_url")
      .eq("id", user.id)
      .single();
    employeeData = data;
  }

  if (!employeeData && demoEmployeeId) {
    // Demo mode: use demo cookie employee ID
    const { data } = await dataClient
      .from("employees")
      .select("id, full_name, position, email, role, room, phone, telegram, building, avatar_url")
      .eq("id", demoEmployeeId)
      .single();
    employeeData = data;
  }



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