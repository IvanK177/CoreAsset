import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import PageHeader from "@/components/layout/PageHeader";
import { Monitor, CheckCircle, Wrench, Package } from "lucide-react";
import { daysUntilExpiry } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [workplacesRes, computersRes, incidentsRes, licensesRes] = await Promise.all([
    supabase.from("workplaces").select("id, employee_id, computer_id"),
    supabase.from("computers").select("id, lifecycle_status"),
    supabase
      .from("incidents")
      .select("id, description, priority, status, computer_id")
      .neq("status", "resolved"),
    supabase
      .from("license_pools")
      .select("id, expires_at, software_id, software(name)")
      .eq("license_type", "subscription"),
  ]);

  const workplaces = workplacesRes.data ?? [];
  const computers = computersRes.data ?? [];
  const allIncidents = incidentsRes.data ?? [];
  const allLicenses = licensesRes.data ?? [];

  const total = workplaces.length;
  const active = workplaces.filter((w) => w.employee_id && w.computer_id).length;
  const repair = computers.filter((c) => c.lifecycle_status === "repair").length;
  const vacant = workplaces.filter((w) => !w.employee_id).length;

  const criticalIncidents = allIncidents.filter((i) => i.priority === "critical");

  const expiringLicenses = allLicenses.filter((l) => {
    const days = daysUntilExpiry(l.expires_at);
    return days !== null && days <= 30;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Обзор состояния IT-инфраструктуры" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Всего рабочих мест" value={total} icon={Monitor} />
        <StatCard label="Активных" value={active} icon={CheckCircle} color="green" />
        <StatCard label="В ремонте" value={repair} icon={Wrench} color="amber" />
        <StatCard label="Вакантных" value={vacant} icon={Package} color="blue" />
      </div>

      <div className="space-y-3">
        <AlertBanner
          title={`Критические инциденты (${criticalIncidents.length})`}
          variant="critical"
          items={criticalIncidents.map((i) => ({
            id: i.id,
            label: i.description,
            href: `/incidents/${i.id}`,
          }))}
        />
        <AlertBanner
          title={`Истекают лицензии (${expiringLicenses.length})`}
          variant="warning"
          items={expiringLicenses.map((l) => ({
            id: l.id,
            label: `${(l.software as { name: string } | null)?.name ?? "—"} — ${daysUntilExpiry(l.expires_at)} дн.`,
            href: `/licenses`,
          }))}
        />
      </div>
    </div>
  );
}
