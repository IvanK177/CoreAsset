"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { softwareSchema, licensePoolSchema } from "@/lib/schemas/license.schema";

export async function createSoftware(formData: FormData) {
  const supabase = await createClient();
  const parsed = softwareSchema.safeParse({
    name: formData.get("name"),
    version: formData.get("version") || undefined,
    vendor: formData.get("vendor") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from("software").insert(parsed.data);
  if (error) return { error: error.message };
  revalidatePath("/licenses/software");
  redirect("/licenses/software");
}

export async function deleteSoftware(id: string) {
  const supabase = await createClient();
  await supabase.from("software").delete().eq("id", id);
  revalidatePath("/licenses/software");
  redirect("/licenses/software");
}

export async function createLicensePool(formData: FormData) {
  const supabase = await createClient();
  const parsed = licensePoolSchema.safeParse({
    software_id: formData.get("software_id"),
    license_type: formData.get("license_type"),
    total_seats: formData.get("total_seats"),
    expires_at: formData.get("expires_at") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from("license_pools").insert({
    ...parsed.data,
    expires_at: parsed.data.expires_at || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/licenses");
  revalidatePath("/dashboard");
  redirect("/licenses");
}

export async function deleteLicensePool(id: string) {
  const supabase = await createClient();
  await supabase.from("license_pools").delete().eq("id", id);
  revalidatePath("/licenses");
  revalidatePath("/dashboard");
  redirect("/licenses");
}

export async function assignSoftware(computerId: string, softwareId: string) {
  const supabase = await createClient();

  // Pre-check seat availability before inserting.
  // The trigger trg_software_installations_seats will auto-increment used_seats on INSERT,
  // so we must NOT manually update it here (would cause double-counting).
  const { data: pool } = await supabase
    .from("license_pools")
    .select("id, used_seats, total_seats")
    .eq("software_id", softwareId)
    .order("used_seats")
    .limit(1)
    .maybeSingle();

  if (!pool) return { error: "Пул лицензий не найден" };
  if (pool.used_seats >= pool.total_seats) return { error: "Лицензии исчерпаны" };

  const { error: insertError } = await supabase.from("software_installations").insert({
    computer_id: computerId,
    software_id: softwareId,
    license_pool_id: pool.id,
  });
  if (insertError) return { error: insertError.message };

  revalidatePath(`/computers/${computerId}`);
  revalidatePath("/licenses");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard");
}

export async function removeSoftware(installationId: string, computerId: string) {
  const supabase = await createClient();

  // The trigger trg_software_installations_seats will auto-decrement used_seats on DELETE,
  // so we must NOT manually update it here (would cause double-counting).
  // Also removed the call to non-existent RPC "decrement_used_seats".
  await supabase.from("software_installations").delete().eq("id", installationId);

  revalidatePath(`/computers/${computerId}`);
  revalidatePath("/licenses");
}
