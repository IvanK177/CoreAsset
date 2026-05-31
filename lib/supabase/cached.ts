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

export const getCachedDeviceLicenses = unstable_cache(
  async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("device_licenses")
      .select("id, device_id, license_id, installed_at, licenses(id, software_name, version, license_type, total_seats, used_seats, price_per_unit, expires_at)")
      .order("installed_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["device-licenses-list"],
  { tags: ["device_licenses", "licenses"] }
);

export const getCachedDevices = unstable_cache(
  async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .order("inventory_number");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["devices-list"],
  { tags: ["devices"] }
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
      .select("id, full_name, position, room, building")
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

export const getCachedDeviceLicensesWithDevices = unstable_cache(
  async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("device_licenses")
      .select("id, device_id, license_id, installed_at, devices(inventory_number, employees!devices_employee_id_fkey(building))")
      .order("installed_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["device-licenses-with-devices-list"],
  { tags: ["device_licenses", "devices"] }
);

export const getCachedIncidentsWithRelations = unstable_cache(
  async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("incidents")
      .select("id, title, description, priority, status, created_at, incident_type, device_id, employee_id, devices!incidents_device_id_fkey(id, inventory_number, device_type, computer_type), employees!incidents_employee_id_fkey(id, full_name, position, room), assignee:employees!incidents_assigned_to_fkey(id, full_name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["incidents-with-relations-list"],
  { tags: ["incidents", "devices", "employees"] }
);

export const getCachedRoomRequests = unstable_cache(
  async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("room_requests")
      .select("id, room, type, description, status, author_id, created_at, employees!room_requests_author_id_fkey(id, full_name, position, room, building)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["room-requests-list"],
  { tags: ["room_requests", "employees"] }
);

