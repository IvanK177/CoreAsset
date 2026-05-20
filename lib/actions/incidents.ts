"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { incidentSchema } from "@/lib/schemas/incident.schema";

export async function createIncident(formData: FormData) {
  const supabase = await createClient();
  const parsed = incidentSchema.safeParse({
    computer_id: formData.get("computer_id") || undefined,
    incident_type: formData.get("incident_type"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    status: "open",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data, error } = await supabase.from("incidents").insert({
    ...parsed.data,
    computer_id: parsed.data.computer_id || null,
  }).select("id").single();

  if (error) return { error: error.message };
  revalidatePath("/incidents");
  redirect(`/incidents/${data.id}`);
}

export async function updateIncidentStatus(id: string, status: "open" | "in_progress" | "resolved") {
  const supabase = await createClient();
  await supabase.from("incidents").update({
    status,
    resolved_at: status === "resolved" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  revalidatePath(`/incidents/${id}`);
  revalidatePath("/incidents");
}

export async function deleteIncident(id: string) {
  const supabase = await createClient();
  await supabase.from("incidents").delete().eq("id", id);
  revalidatePath("/incidents");
  redirect("/incidents");
}
