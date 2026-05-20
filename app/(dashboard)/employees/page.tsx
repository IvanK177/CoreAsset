import { createClient } from "@/lib/supabase/server";
import EmployeeTable from "@/components/employees/EmployeeTable";
import PageHeader from "@/components/layout/PageHeader";

export default async function EmployeesPage() {
  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .order("full_name");

  return (
    <div>
      <PageHeader
        title="Сотрудники"
        description="Список сотрудников организации"
        action={{ label: "Добавить сотрудника", href: "/employees/new" }}
      />
      <EmployeeTable employees={employees ?? []} />
    </div>
  );
}
