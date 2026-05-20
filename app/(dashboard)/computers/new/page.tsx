import ComputerForm from "@/components/computers/ComputerForm";
import PageHeader from "@/components/layout/PageHeader";
import { createComputer } from "@/lib/actions/computers";

export default function NewComputerPage() {
  return (
    <div>
      <PageHeader title="Добавить компьютер" />
      <ComputerForm action={createComputer} />
    </div>
  );
}
