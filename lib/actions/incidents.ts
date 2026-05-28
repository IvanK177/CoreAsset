"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { incidentSchema } from "@/lib/schemas/incident.schema";

/** Convert FormData entry values: null → undefined, empty string → undefined */
function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  if (value === null || value === "") return undefined;
  return value as string;
}

export async function createIncident(formData: FormData) {
  const supabase = await createServiceClient();
  const parsed = incidentSchema.safeParse({
    computer_id: emptyToUndefined(formData.get("computer_id")),
    employee_id: emptyToUndefined(formData.get("employee_id")),
    incident_type: emptyToUndefined(formData.get("incident_type")),
    title: emptyToUndefined(formData.get("title")),
    description: emptyToUndefined(formData.get("description")),
    priority: emptyToUndefined(formData.get("priority")),
    status: "open",
  });
  if (!parsed.success) {
    console.error("[createIncident] Validation failed:", parsed.error.issues);
    return { error: parsed.error.issues[0].message };
  }

  const createdAt = formData.get("created_at") as string | null;

  const insertData = {
    ...parsed.data,
    title: parsed.data.title || null,
    computer_id: parsed.data.computer_id || null,
    employee_id: parsed.data.employee_id || null,
    ...(createdAt ? { created_at: new Date(createdAt).toISOString() } : {}),
  };
  console.log("[createIncident] Inserting incident with computer_id:", insertData.computer_id);

  const { data, error } = await supabase.from("incidents").insert(insertData).select("id").single();

  if (error) {
    console.error("[createIncident] Supabase insert error:", error.code, error.message);
    return { error: error.message, code: error.code };
  }
  revalidateTag("incidents", { expire: 0 });
  revalidatePath("/incidents");
  revalidatePath("/dashboard");
  revalidatePath("/it-portal");
  revalidatePath("/it-portal/my-tasks");
  redirect(`/incidents/${data.id}`);
}

export async function updateIncidentStatus(id: string, status: "open" | "in_progress" | "resolved") {
  const supabase = await createServiceClient();
  await supabase.from("incidents").update({
    status,
    resolved_at: status === "resolved" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  revalidateTag("incidents", { expire: 0 });
  revalidatePath(`/incidents/${id}`);
  revalidatePath("/incidents");
  revalidatePath("/dashboard");
  revalidatePath("/it-portal");
  revalidatePath("/it-portal/my-tasks");
}

/** Non-redirecting variant for dialog use — returns { success, id } or { error } */
export async function createIncidentDialog(formData: FormData) {
  const supabase = await createServiceClient();
  const parsed = incidentSchema.safeParse({
    computer_id: emptyToUndefined(formData.get("computer_id")),
    employee_id: emptyToUndefined(formData.get("employee_id")),
    incident_type: emptyToUndefined(formData.get("incident_type")) || "other",
    title: emptyToUndefined(formData.get("title")),
    description: formData.get("description"),
    priority: emptyToUndefined(formData.get("priority")) || "medium",
    status: "open",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message, code: undefined };

  const createdAt = formData.get("created_at") as string | null;

  const insertData = {
    ...parsed.data,
    title: parsed.data.title || null,
    computer_id: parsed.data.computer_id || null,
    employee_id: parsed.data.employee_id || null,
    ...(createdAt ? { created_at: new Date(createdAt).toISOString() } : {}),
  };

  const { data, error } = await supabase.from("incidents").insert(insertData).select("id").single();
  if (error) return { error: error.message, code: error.code };

  revalidateTag("incidents", { expire: 0 });
  revalidatePath("/incidents");
  revalidatePath("/dashboard");
  revalidatePath("/it-portal");
  revalidatePath("/it-portal/my-tasks");
  return { success: true, id: data.id };
}

/** Non-redirecting variant for creating incident from computer card context — auto-passes computer_id and employee_id */
export async function createIncidentFromComputer(
  computerId: string,
  employeeId: string | null,
  title: string,
  description: string | undefined,
  priority: string,
) {
  const supabase = await createServiceClient();

  const parsed = incidentSchema.safeParse({
    computer_id: computerId,
    employee_id: employeeId ?? undefined,
    incident_type: "other",
    title: title,
    description: title + (description ? "\n\n" + description : ""),
    priority,
    status: "open",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message, code: undefined };

  const insertData = {
    ...parsed.data,
    title: parsed.data.title || null,
    computer_id: parsed.data.computer_id || null,
    employee_id: parsed.data.employee_id || null,
  };

  const { data, error } = await supabase.from("incidents").insert(insertData).select("id").single();
  if (error) return { error: error.message, code: error.code };

  revalidateTag("incidents", { expire: 0 });
  revalidatePath("/incidents");
  revalidatePath(`/computers/${computerId}`);
  revalidatePath("/computers");
  revalidatePath("/dashboard");
  revalidatePath("/it-portal");
  revalidatePath("/it-portal/my-tasks");
  return { success: true, id: data.id };
}

export async function deleteIncident(id: string) {
  const supabase = await createServiceClient();
  await supabase.from("incidents").delete().eq("id", id);
  revalidateTag("incidents", { expire: 0 });
  revalidatePath("/incidents");
  revalidatePath("/dashboard");
  revalidatePath("/it-portal");
  revalidatePath("/it-portal/my-tasks");
  redirect("/incidents");
}
