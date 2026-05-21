"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { incidentSchema } from "@/lib/schemas/incident.schema";

/** Convert FormData entry values: null → undefined, empty string → undefined */
function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  if (value === null || value === "") return undefined;
  return value as string;
}

export async function createIncident(formData: FormData) {
  const supabase = await createClient();
  const parsed = incidentSchema.safeParse({
    computer_id: emptyToUndefined(formData.get("computer_id")),
    incident_type: emptyToUndefined(formData.get("incident_type")),
    description: emptyToUndefined(formData.get("description")),
    priority: emptyToUndefined(formData.get("priority")),
    status: "open",
  });
  if (!parsed.success) {
    console.error("[createIncident] Validation failed:", parsed.error.issues);
    return { error: parsed.error.issues[0].message };
  }

  const insertData = {
    ...parsed.data,
    computer_id: parsed.data.computer_id || null,
  };
  console.log("[createIncident] Inserting incident with computer_id:", insertData.computer_id);

  const { data, error } = await supabase.from("incidents").insert(insertData).select("id").single();

  if (error) {
    console.error("[createIncident] Supabase insert error:", error.code, error.message);
    return { error: error.message };
  }
  revalidatePath("/incidents");
  revalidatePath("/dashboard");
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
  revalidatePath("/dashboard");
}

export async function deleteIncident(id: string) {
  const supabase = await createClient();
  await supabase.from("incidents").delete().eq("id", id);
  revalidatePath("/incidents");
  revalidatePath("/dashboard");
  redirect("/incidents");
}
