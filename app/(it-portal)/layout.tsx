import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import ITPortalHeader from "@/components/it-portal/ITPortalHeader";

export default async function ITPortalLayout({ children }: { children: React.ReactNode }) {
  const authClient = await createClient();
  const dataClient = createServiceClient();
  const { data: { user } } = await authClient.auth.getUser();

  const cookieStore = await cookies();
  const demoRole = cookieStore.get("demo_role")?.value;
  const demoEmployeeId = cookieStore.get("demo_employee_id")?.value;

  // Get IT specialist employee data
  let employeeData = null;
  const employeeId = demoEmployeeId || null;

  if (employeeId) {
    const { data } = await dataClient
      .from("employees")
      .select("id, full_name, position, email, role")
      .eq("id", employeeId)
      .single();
    employeeData = data;
  } else if (user?.email) {
    const { data } = await dataClient
      .from("employees")
      .select("id, full_name, position, email, role")
      .eq("email", user.email)
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
      <main className="pt-16">
        <div className="max-w-5xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}