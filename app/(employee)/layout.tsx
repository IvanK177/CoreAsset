import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import PortalHeader from "@/components/portal/PortalHeader";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const authClient = await createClient();
  const dataClient = createServiceClient();
  const { data: { user } } = await authClient.auth.getUser();

  const cookieStore = await cookies();
  const demoRole = cookieStore.get("demo_role")?.value;
  const demoEmployeeId = cookieStore.get("demo_employee_id")?.value;

  // Get employee data — prefer user.id match (trigger-synced), then demo cookie, then fallback
  let employeeData = null;

  if (user?.id) {
    // Primary: match by user.id (auth.users.id → employees.id via trigger)
    const { data } = await dataClient
      .from("employees")
      .select("id, full_name, position, email, room")
      .eq("id", user.id)
      .single();
    employeeData = data;
  }

  if (!employeeData && demoEmployeeId) {
    // Demo mode: use demo cookie employee ID
    const { data } = await dataClient
      .from("employees")
      .select("id, full_name, position, email, room")
      .eq("id", demoEmployeeId)
      .single();
    employeeData = data;
  }

  if (!employeeData) {
    // Fallback: use hardcoded demo employee
    const { data } = await dataClient
      .from("employees")
      .select("id, full_name, position, email, room")
      .eq("id", "e0000001-0000-0000-0000-000000000001")
      .single();
    employeeData = data;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <PortalHeader
        employeeName={employeeData?.full_name ?? "Сотрудник"}
        employeePosition={employeeData?.position ?? ""}
      />
      <main className="pt-16">
        <div className="max-w-4xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}