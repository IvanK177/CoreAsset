"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { compressText, decompressText } from "@/lib/compression";

/** Create an incident from the employee portal (non-redirecting) */
export async function createPortalIncident(formData: FormData) {
  const supabase = await createServiceClient();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const deviceId = formData.get("device_id") as string | null;
  const employeeId = formData.get("employee_id") as string;
  const priority = formData.get("priority") as string;

  const photoUrlsRaw = formData.get("photo_urls") as string | null;
  const photoUrls = photoUrlsRaw ? JSON.parse(photoUrlsRaw) : [];

  const insertData = {
    title: title || "",
    description: description || title,
    device_id: deviceId || null,
    employee_id: employeeId,
    incident_type: "other" as const,
    priority: priority as "low" | "medium" | "high" | "critical",
    status: "open" as const,
    photo_urls: photoUrls,
  };

  const { data, error } = await supabase
    .from("incidents")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    console.error("[createPortalIncident] Supabase insert error:", error.code, error.message);
    return { error: error.message, code: error.code };
  }

  revalidateTag("incidents", { expire: 0 });
  revalidatePath("/portal");
  revalidatePath("/incidents");
  revalidatePath("/dashboard");
  revalidatePath("/it-portal");
  revalidatePath("/it-portal/my-tasks");
  return { success: true, id: data.id };
}

/** Sign out from portal — clears all auth cookies, demo cookies, and Supabase session */
export async function portalSignOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.delete("demo_role");
  cookieStore.delete("demo_employee_id");

  // Delete all Supabase auth cookies (sb-* prefix)
  const allCookies = cookieStore.getAll();
  allCookies.forEach((cookie) => {
    if (cookie.name.startsWith("sb-")) {
      cookieStore.delete(cookie.name);
    }
  });

  const { redirect } = await import("next/navigation");
  redirect("/login");
}

/** Cancel (delete) an incident from the employee portal if it is still open */
export async function cancelPortalIncident(id: string) {
  const supabase = await createServiceClient();

  // 1. Fetch incident status to ensure it is still "open"
  const { data: incident, error: fetchError } = await supabase
    .from("incidents")
    .select("status, description, title")
    .eq("id", id)
    .single();

  if (fetchError || !incident) {
    return { error: "Заявка не найдена" };
  }

  if (incident.status !== "open") {
    return { error: "Нельзя отменить заявку, которая уже находится в работе или выполнена" };
  }

  const description = incident.description ?? "";
  let title = incident.title ?? "";

  const plainDescription = description.startsWith("gz:") ? await decompressText(description) : description;
  if (!title) {
    title = plainDescription.split("\n")[0]?.substring(0, 80) || "Инцидент";
  }
  const compressedDescription = await compressText(plainDescription);

  // 2. Update status to 'cancelled' and compress description
  const { error: updateError } = await supabase
    .from("incidents")
    .update({
      status: "cancelled",
      description: compressedDescription,
      title: title,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (updateError) {
    return { error: "Ошибка при отмене заявки: " + updateError.message };
  }

  revalidateTag("incidents", { expire: 0 });
  revalidatePath("/portal");
  revalidatePath("/incidents");
  revalidatePath("/dashboard");
  revalidatePath("/it-portal");
  revalidatePath("/it-portal/my-tasks");
  return { success: true };
}

/** Create a room request from the employee portal */
export async function createPortalRoomRequest(formData: FormData) {
  const supabase = createServiceClient();

  const room = formData.get("room") as string;
  const type = formData.get("type") as string;
  const description = formData.get("description") as string;
  const authorId = formData.get("author_id") as string;

  const insertData = {
    room: room.trim(),
    type: type,
    description: description.trim(),
    author_id: authorId,
    status: "open" as const,
  };

  const { data, error } = await supabase
    .from("room_requests")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    console.error("[createPortalRoomRequest] Error:", error.message);
    return { error: error.message };
  }

  revalidateTag("room_requests", { expire: 0 });
  revalidatePath("/portal");
  revalidatePath("/incidents");
  revalidatePath("/facilities-portal");
  return { success: true, id: data.id };
}

/** Update employee profile from the employee portal */
export async function updateEmployeeProfile(employeeId: string, formData: FormData) {
  const supabase = createServiceClient();

  const fullName = formData.get("full_name") as string;
  const email = formData.get("email") as string | null;
  const position = formData.get("position") as string | null;
  const phone = formData.get("phone") as string | null;
  const telegram = formData.get("telegram") as string | null;
  const room = formData.get("room") as string | null;
  const building = formData.get("building") as string | null;

  if (!fullName || !fullName.trim()) {
    return { error: "ФИО обязательно для заполнения" };
  }

  // If email has changed, update it in Supabase Auth too
  if (email && email.trim()) {
    // Check if email already exists on another employee
    const { data: existing } = await supabase
      .from("employees")
      .select("id")
      .eq("email", email.trim())
      .neq("id", employeeId)
      .maybeSingle();

    if (existing) {
      return { error: "Этот email уже используется другим сотрудником" };
    }

    // Update in auth system
    const { error: authError } = await supabase.auth.admin.updateUserById(employeeId, {
      email: email.trim(),
    });

    if (authError) {
      console.error("[updateEmployeeProfile] Auth update error:", authError.message);
      return { error: "Ошибка при обновлении email в системе аутентификации: " + authError.message };
    }
  }

  const { error } = await supabase
    .from("employees")
    .update({
      full_name: fullName.trim(),
      email: email ? email.trim() : undefined,
      position: position ? position.trim() : undefined,
      phone: phone ? phone.trim() : null,
      telegram: telegram ? telegram.trim() : null,
      room: room ? room.trim() : null,
      building: building || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", employeeId);

  if (error) {
    console.error("[updateEmployeeProfile] Error:", error.message);
    return { error: error.message };
  }

  revalidateTag("employees", { expire: 0 });
  revalidatePath("/portal");
  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId}`);
  revalidatePath("/dashboard");
  return { success: true };
}