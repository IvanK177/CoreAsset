import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import FacilitiesPortalHeader from "@/components/facilities/FacilitiesPortalHeader";
import { RealtimeNotifications } from "@/components/shared/RealtimeNotifications";

export default async function FacilitiesPortalLayout({ children }: { children: React.ReactNode }) {
  const authClient = await createClient();
  const dataClient = createServiceClient();

  const [, userRes] = await Promise.all([
    dataClient.from("room_requests").select("id, status").neq("status", "resolved"),
    authClient.auth.getUser(),
  ]);

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
      .eq("role", "facilities")
      .eq("is_active", true)
      .limit(1)
      .single();
    employeeData = data;
  }

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
