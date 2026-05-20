"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { workplaceSchema } from "@/lib/schemas/workplace.schema";

export async function createWorkplace(formData: FormData) {
  const supabase = await createClient();
  const raw = {
    room: formData.get("room"),
    computer_id: formData.get("computer_id") || undefined,
    employee_id: formData.get("employee_id") || undefined,
  };

  const parsed = workplaceSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from("workplaces").insert({
    room: parsed.data.room,
    computer_id: parsed.data.computer_id || null,
    employee_id: parsed.data.employee_id || null,
    assigned_at: parsed.data.employee_id ? new Date().toISOString() : null,
  });

  if (error) return { error: error.message };
  revalidatePath("/workplaces");
  redirect("/workplaces");
}

export async function updateWorkplace(id: string, formData: FormData) {
  const supabase = await createClient();
  const raw = {
    room: formData.get("room"),
    computer_id: formData.get("computer_id") || undefined,
    employee_id: formData.get("employee_id") || undefined,
  };

  const parsed = workplaceSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from("workplaces").update({
    room: parsed.data.room,
    computer_id: parsed.data.computer_id || null,
    employee_id: parsed.data.employee_id || null,
    assigned_at: parsed.data.employee_id ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/workplaces");
  revalidatePath(`/workplaces/${id}`);
  redirect(`/workplaces/${id}`);
}

export async function assignEmployee(workplaceId: string, employeeId: string | null) {
  const supabase = await createClient();
  await supabase.from("workplaces").update({
    employee_id: employeeId,
    assigned_at: employeeId ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", workplaceId);
  revalidatePath("/workplaces");
  revalidatePath(`/workplaces/${workplaceId}`);
}

export async function deleteWorkplace(id: string) {
  const supabase = await createClient();
  await supabase.from("workplaces").delete().eq("id", id);
  revalidatePath("/workplaces");
  redirect("/workplaces");
}
