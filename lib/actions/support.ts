"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAuth } from "./auth";

export async function sendSupportRequest(message: string) {
  if (!message || !message.trim()) {
    return { error: "Текст обращения не может быть пустым" };
  }

  const { user } = await requireAuth();
  const dataClient = createServiceClient();

  const employeeId = user.id;

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
  await requireAuth(["admin", "developer"]);
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
  await requireAuth(["admin", "developer"]);
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
