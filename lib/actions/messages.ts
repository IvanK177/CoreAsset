"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function getCurrentEmployee() {
  const authClient = await createClient();
  const dataClient = createServiceClient();
  const cookieStore = await cookies();
  const demoEmployeeId = cookieStore.get("demo_employee_id")?.value;

  const { data: { user } } = await authClient.auth.getUser();

  let employee = null;
  if (user?.id) {
    const { data } = await dataClient
      .from("employees")
      .select("id, full_name, email, role")
      .eq("id", user.id)
      .single();
    employee = data;
  }

  if (!employee && demoEmployeeId) {
    const { data } = await dataClient
      .from("employees")
      .select("id, full_name, email, role")
      .eq("id", demoEmployeeId)
      .single();
    employee = data;
  }

  return employee;
}

export async function getIncidentMessages(incidentId: string) {
  const employee = await getCurrentEmployee();
  if (!employee) {
    return [];
  }

  const supabase = createServiceClient();

  // Enforce visibility check: only admin, ticket creator, or assigned specialist can access chat
  if (employee.role !== "admin") {
    const { data: incident, error: incError } = await supabase
      .from("incidents")
      .select("employee_id, assigned_to")
      .eq("id", incidentId)
      .single();

    if (incError || !incident) {
      console.error("[getIncidentMessages] Incident lookup failed:", incError);
      return [];
    }

    if (incident.employee_id !== employee.id && incident.assigned_to !== employee.id) {
      console.warn(`[getIncidentMessages] Access denied to user ${employee.id} for incident ${incidentId}`);
      return [];
    }
  }
  
  const { data, error } = await supabase
    .from("incident_messages")
    .select("*, sender:employees!incident_messages_sender_id_fkey(full_name)")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getIncidentMessages] Error:", error.code, error.message);
    return [];
  }

  return data ?? [];
}

export async function sendMessage(incidentId: string, text: string, photoUrls?: string[]) {
  const hasText = text && text.trim();
  const hasPhotos = photoUrls && photoUrls.length > 0;

  if (!hasText && !hasPhotos) {
    return { error: "Сообщение не может быть пустым" };
  }

  const employee = await getCurrentEmployee();
  if (!employee) {
    return { error: "Пользователь не найден или не авторизован" };
  }

  const supabase = createServiceClient();

  // Enforce visibility check: only admin, ticket creator, or assigned specialist can send messages
  if (employee.role !== "admin") {
    const { data: incident, error: incError } = await supabase
      .from("incidents")
      .select("employee_id, assigned_to")
      .eq("id", incidentId)
      .single();

    if (incError || !incident) {
      return { error: "Инцидент не найден" };
    }

    if (incident.employee_id !== employee.id && incident.assigned_to !== employee.id) {
      return { error: "У вас нет прав на отправку сообщений в этот чат" };
    }
  }

  const { error } = await supabase
    .from("incident_messages")
    .insert({
      incident_id: incidentId,
      sender_id: employee.id,
      text: (text ?? "").trim(),
      photo_urls: photoUrls ?? [],
    });

  if (error) {
    console.error("[sendMessage] Insert error:", error.code, error.message);
    return { error: "Не удалось отправить сообщение: " + error.message };
  }

  revalidatePath(`/incidents/${incidentId}`);
  revalidatePath("/portal");
  revalidatePath("/it-portal");
  revalidatePath("/it-portal/my-tasks");
  revalidatePath("/it-portal/archive");
  
  return { success: true };
}
