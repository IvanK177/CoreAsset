"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";

export async function sendSupportRequest(message: string) {
  if (!message || !message.trim()) {
    return { error: "Текст обращения не может быть пустым" };
  }

  const authClient = await createClient();
  const dataClient = createServiceClient();
  const cookieStore = await cookies();
  const demoEmployeeId = cookieStore.get("demo_employee_id")?.value;

  const { data: { user } } = await authClient.auth.getUser();

  let employeeId = user?.id;
  if (!employeeId && demoEmployeeId) {
    employeeId = demoEmployeeId;
  }

  if (!employeeId) {
    employeeId = "e0000001-0000-0000-0000-000000000001"; // Fallback to a valid employee ID
  }

  const { data, error } = await dataClient
    .from("support_requests")
    .insert({
      author_id: employeeId,
      message: message.trim(),
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[sendSupportRequest] Error:", error.message);
    return { error: error.message };
  }

  revalidateTag("support_requests", { expire: 0 });
  revalidatePath("/dev-portal");
  return { success: true, id: data.id };
}

export async function takeSupportRequestToWork(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("support_requests")
    .update({ status: "in_progress" })
    .eq("id", id);

  if (error) {
    console.error("[takeSupportRequestToWork] Error:", error.message);
    return { error: error.message };
  }

  revalidateTag("support_requests", { expire: 0 });
  revalidatePath("/dev-portal");
  return { success: true };
}

export async function resolveSupportRequest(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("support_requests")
    .update({ status: "resolved" })
    .eq("id", id);

  if (error) {
    console.error("[resolveSupportRequest] Error:", error.message);
    return { error: error.message };
  }

  revalidateTag("support_requests", { expire: 0 });
  revalidatePath("/dev-portal");
  return { success: true };
}
