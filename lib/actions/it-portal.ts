"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Assign an incident to the current IT specialist and set status to "in_progress".
 * The `assigned_to` field stores the employee ID of the IT specialist who took the ticket.
 */
export async function takeIncidentToWork(incidentId: string, specialistId: string) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("incidents")
    .update({
      status: "in_progress",
      assigned_to: specialistId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", incidentId);

  if (error) {
    console.error("[takeIncidentToWork] Error:", error.message);
    return { error: error.message };
  }

  revalidateTag("incidents", { expire: 0 });
  revalidatePath("/it-portal");
  revalidatePath("/it-portal/my-tasks");
  revalidatePath("/incidents");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Resolve an incident: set status to "resolved" and record resolved_at timestamp.
 */
export async function resolveIncident(incidentId: string) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("incidents")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", incidentId);

  if (error) {
    console.error("[resolveIncident] Error:", error.message);
    return { error: error.message };
  }

  revalidateTag("incidents", { expire: 0 });
  revalidatePath("/it-portal");
  revalidatePath("/it-portal/my-tasks");
  revalidatePath("/incidents");
  revalidatePath("/dashboard");
  return { success: true };
}