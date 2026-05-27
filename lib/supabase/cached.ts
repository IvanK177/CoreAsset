import { unstable_cache } from "next/cache";
import { createServiceClient } from "./server";

export const getCachedTemplates = unstable_cache(
  async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("computer_templates")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["computer-templates-list"],
  { tags: ["templates"] }
);

export const getCachedLicenses = unstable_cache(
  async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("licenses")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["licenses-list"],
  { tags: ["licenses"] }
);

export const getCachedComputerLicenses = unstable_cache(
  async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("computer_licenses")
      .select("id, computer_id, license_id, installed_at, licenses(id, software_name, version, license_type, total_seats, used_seats, price_per_unit, expires_at)")
      .order("installed_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["computer-licenses-list"],
  { tags: ["computer_licenses", "licenses"] }
);

export const getCachedComputers = unstable_cache(
  async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("computers")
      .select("*")
      .order("inventory_number");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["computers-list"],
  { tags: ["computers"] }
);

export const getCachedEmployees = unstable_cache(
  async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("full_name");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["employees-list"],
  { tags: ["employees"] }
);

export const getCachedActiveEmployees = unstable_cache(
  async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("employees")
      .select("id, full_name, position, room")
      .eq("is_active", true)
      .order("full_name");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["active-employees-list"],
  { tags: ["employees"] }
);

export const getCachedIncidents = unstable_cache(
  async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["incidents-list"],
  { tags: ["incidents"] }
);

export const getCachedComputerLicensesWithComputers = unstable_cache(
  async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("computer_licenses")
      .select("id, computer_id, license_id, installed_at, computers(inventory_number)")
      .order("installed_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["computer-licenses-with-computers-list"],
  { tags: ["computer_licenses", "computers"] }
);

export const getCachedIncidentsWithRelations = unstable_cache(
  async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("incidents")
      .select("id, description, priority, status, created_at, incident_type, computer_id, employee_id, computers!incidents_computer_id_fkey(id, inventory_number), employees!incidents_employee_id_fkey(id, full_name, position, room)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["incidents-with-relations-list"],
  { tags: ["incidents", "computers", "employees"] }
);
