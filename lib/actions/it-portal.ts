"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { compressText, decompressText } from "@/lib/compression";

/**
 * Assign an incident to the current IT specialist and set status to "in_progress".
 * The `assigned_to` field stores the employee ID of the IT specialist who took the ticket.
 */
export async function takeIncidentToWork(incidentId: string, specialistId: string) {
  const supabase = createServiceClient();

  const { data: current } = await supabase
    .from("incidents")
    .select("description")
    .eq("id", incidentId)
    .single();

  let description = current?.description ?? "";
  if (description.startsWith("gz:")) {
    description = await decompressText(description);
  }

  const { error } = await supabase
    .from("incidents")
    .update({
      status: "in_progress",
      description,
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
export async function resolveIncident(incidentId: string, resolution: string, resolutionPhotoUrls: string[] = []) {
  const supabase = createServiceClient();

  const { data: current } = await supabase
    .from("incidents")
    .select("description, title")
    .eq("id", incidentId)
    .single();

  const description = current?.description ?? "";
  let title = current?.title ?? "";

  const plainDescription = description.startsWith("gz:") ? await decompressText(description) : description;
  if (!title) {
    title = plainDescription.split("\n")[0]?.substring(0, 80) || "Инцидент";
  }
  const compressedDescription = await compressText(plainDescription);

  const { error } = await supabase
    .from("incidents")
    .update({
      status: "resolved",
      description: compressedDescription,
      title: title || "",
      resolution: resolution.trim() || null,
      resolution_photo_urls: resolutionPhotoUrls,
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