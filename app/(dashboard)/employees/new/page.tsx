export const dynamic = 'force-dynamic';
export const revalidate = 0;

import EmployeeForm from "@/components/employees/EmployeeForm";
import PageHeader from "@/components/layout/PageHeader";
import { createEmployee } from "@/lib/actions/employees";

export default function NewEmployeePage() {
  return (
    <div>
      <PageHeader title="Добавить сотрудника" />
      <EmployeeForm action={createEmployee} />
    </div>
  );
}
