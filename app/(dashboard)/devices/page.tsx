export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { DevicesPageClient } from "@/components/devices/DevicesPageClient";
import type { DeviceWithEmployee, ActiveEmployee } from "@/components/devices/DevicesClientView";
import { extractJoinObject } from "@/lib/utils";
import type { Tables } from "@/types/database.types";
import {
  getCachedDevices,
  getCachedEmployees,
  getCachedActiveEmployees,
  getCachedDeviceLicenses,
  getCachedIncidents,
  getCachedLicenses,
  getCachedTemplates,
} from "@/lib/supabase/cached";

type Employee = Tables<"employees">;

export default async function DevicesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const [devices, allEmployees, activeEmployees, rawInstalls, incidents, rawLicenses, templates] = await Promise.all([
    getCachedDevices(),
    getCachedEmployees(),
    getCachedActiveEmployees() as Promise<ActiveEmployee[]>,
    getCachedDeviceLicenses() as Promise<unknown[]>,
    getCachedIncidents() as Promise<Tables<"incidents">[]>,
    getCachedLicenses(),
    getCachedTemplates(),
  ]);

  // Build a map of employee_id -> employee for matching
  const employeeMap = new Map<string, Employee>();
  for (const e of allEmployees) {
    employeeMap.set(e.id, e);
  }

  // Enrich devices with employee data (using devices.employee_id directly)
  const devicesWithEmployee: DeviceWithEmployee[] = devices.map((d) => {
    let employee: Employee | null = null;
    if (d.employee_id) {
      employee = employeeMap.get(d.employee_id) ?? null;
    }

    return {
      ...d,
      employees: employee ? {
        id: employee.id,
        full_name: employee.full_name,
        position: employee.position,
        email: employee.email,
        room: employee.room ?? null,
        building: employee.building ?? null,
      } : null,
    };
  });

  const { filter } = await searchParams;
  const validFilters = ["active", "repair", "storage", "decommissioned", "all"];
  const initialFilter = filter && validFilters.includes(filter) ? filter : "all";

  // Build license options for the Install Software dialog
  const licenseOptions = rawLicenses.map((l) => ({
    id: l.id,
    software_name: l.software_name ?? "—",
    used_seats: l.used_seats,
    total_seats: l.total_seats,
  }));

  // Normalize installations — extract joined license data
  const installations = (rawInstalls as {
    id: string;
    device_id: string | null;
    license_id: string | null;
    installed_at: string | null;
    licenses: unknown;
  }[]).map((inst) => ({
    id: inst.id,
    device_id: inst.device_id,
    license_id: inst.license_id,
    installed_at: inst.installed_at,
    licenses: extractJoinObject(inst.licenses) as { id: string; software_name: string; version: string | null; license_type: string; total_seats: number; used_seats: number; price_per_unit: number | null; expires_at: string | null } | null,
  }));

  // Normalize incidents to ensure non-null fields
  const normalizedIncidents = incidents.map((inc) => ({
    ...inc,
    description: inc.description || "",
    priority: inc.priority || "medium",
    status: inc.status || "open",
    incident_type: inc.incident_type || "other",
    created_at: inc.created_at || new Date().toISOString(),
  }));

  return (
    <DevicesPageClient
      devices={devicesWithEmployee}
      activeEmployees={activeEmployees}
      installations={installations}
      incidents={normalizedIncidents}
      licenseOptions={licenseOptions}
      initialFilter={initialFilter}
      templates={templates}
    />
  );
}
