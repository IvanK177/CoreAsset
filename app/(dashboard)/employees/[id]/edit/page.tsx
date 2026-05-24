export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EmployeeForm from "@/components/employees/EmployeeForm";
import PageHeader from "@/components/layout/PageHeader";
import { updateEmployee } from "@/lib/actions/employees";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: employee } = await supabase.from("employees").select("*").eq("id", id).single();
  if (!employee) notFound();

  const action = updateEmployee.bind(null, id);

  return (
    <div>
      <PageHeader title="Редактировать сотрудника" />
      <EmployeeForm employee={employee} action={action} />
    </div>
  );
}
