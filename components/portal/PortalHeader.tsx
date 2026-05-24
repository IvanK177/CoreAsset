import { MonitorIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

async function signOut() {
  "use server";
  const { createClient: createServerClient } = await import("@/lib/supabase/server");
  const { cookies } = await import("next/headers");
  const supabase = await createServerClient();
  await supabase.auth.signOut();

  // Clear demo cookies
  const cookieStore = await cookies();
  cookieStore.delete("demo_role");
  cookieStore.delete("demo_employee_id");

  const { redirect } = await import("next/navigation");
  redirect("/login");
}

interface PortalHeaderProps {
  employeeName: string;
  employeePosition: string;
}

export default function PortalHeader({ employeeName, employeePosition }: PortalHeaderProps) {
  // Extract first name for display
  const firstName = employeeName.split(" ")[0] ?? employeeName;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200">
      {/* Left: Logo + Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#2563eb]">
          <MonitorIcon className="w-5 h-5 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight text-gray-900">CoreAsset</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
            Портал сотрудника
          </span>
        </div>
      </div>

      {/* Right: Employee info + Logout */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-gray-900">{employeeName}</span>
          <span className="text-xs text-gray-500">{employeePosition}</span>
        </div>
        <form action={signOut}>
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className="gap-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </Button>
        </form>
      </div>
    </header>
  );
}