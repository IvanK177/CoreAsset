"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { softwareSchema, licensePoolSchema } from "@/lib/schemas/license.schema";

export async function createSoftware(formData: FormData) {
  const supabase = await createServiceClient();
  const parsed = softwareSchema.safeParse({
    name: formData.get("name"),
    version: formData.get("version") || undefined,
    vendor: formData.get("vendor") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from("software").insert(parsed.data);
  if (error) return { error: error.message, code: error.code };
  revalidatePath("/licenses/software");
  redirect("/licenses/software");
}

export async function deleteSoftware(id: string) {
  const supabase = await createServiceClient();
  await supabase.from("software").delete().eq("id", id);
  revalidatePath("/licenses/software");
  redirect("/licenses/software");
}

export async function createLicensePool(formData: FormData) {
  const supabase = await createServiceClient();
  const parsed = licensePoolSchema.safeParse({
    software_id: formData.get("software_id"),
    license_type: formData.get("license_type"),
    total_seats: formData.get("total_seats"),
    price_per_unit: formData.get("price_per_unit") || 0,
    expires_at: formData.get("expires_at") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from("license_pools").insert({
    ...parsed.data,
    expires_at: parsed.data.expires_at || null,
  });
  if (error) return { error: error.message, code: error.code };
  revalidatePath("/licenses");
  revalidatePath("/dashboard");
  redirect("/licenses");
}

export async function deleteLicensePool(id: string) {
  const supabase = await createServiceClient();
  await supabase.from("license_pools").delete().eq("id", id);
  revalidatePath("/licenses");
  revalidatePath("/dashboard");
  redirect("/licenses");
}

export async function assignSoftware(computerId: string, softwareId: string) {
  const supabase = await createServiceClient();

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

/** Non-redirecting variant for dialog use — installs software from a specific license pool */
export async function installSoftwareDialog(computerId: string, licensePoolId: string, installedAt?: string) {
  const supabase = await createServiceClient();

  // Fetch the license pool to get software_id and check seat availability
  const { data: pool, error: poolError } = await supabase
    .from("license_pools")
    .select("id, software_id, used_seats, total_seats")
    .eq("id", licensePoolId)
    .single();

  if (poolError || !pool) return { error: "Пул лицензий не найден", code: undefined };
  if (pool.used_seats >= pool.total_seats) return { error: "Лицензии исчерпаны", code: undefined };

  const { error: insertError } = await supabase.from("software_installations").insert({
    computer_id: computerId,
    software_id: pool.software_id,
    license_pool_id: pool.id,
    installed_at: installedAt || new Date().toISOString(),
  });
  if (insertError) return { error: insertError.message, code: insertError.code };

  revalidatePath("/computers");
  revalidatePath(`/computers/${computerId}`);
  revalidatePath("/licenses");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function removeSoftware(installationId: string, computerId: string) {
  const supabase = await createServiceClient();

  // The trigger trg_software_installations_seats will auto-decrement used_seats on DELETE,
  // so we must NOT manually update it here (would cause double-counting).
  // Also removed the call to non-existent RPC "decrement_used_seats".
  await supabase.from("software_installations").delete().eq("id", installationId);

  revalidatePath(`/computers/${computerId}`);
  revalidatePath("/licenses");
}

/** Non-redirecting variant for dialog use — creates software + pool in one step */
export async function createLicensePoolDialog(formData: FormData) {
  const supabase = await createServiceClient();

  // 1. Create software entry
  const softwareName = formData.get("software_name") as string;
  const vendor = (formData.get("vendor") as string) || null;

  if (!softwareName) return { error: "Название программы обязательно", code: undefined };

  const { data: software, error: swError } = await supabase
    .from("software")
    .insert({ name: softwareName, vendor })
    .select("id")
    .single();

  if (swError) return { error: swError.message, code: swError.code };

  // 2. Create license pool linked to the new software
  const licenseType = (formData.get("license_type") as "perpetual" | "subscription") || "perpetual";
  const totalSeats = Number(formData.get("total_seats")) || 1;
  const pricePerUnit = Number(formData.get("price_per_unit")) || 0;
  const expiresAt = (formData.get("expires_at") as string) || null;
  const paymentPeriod = (formData.get("payment_period") as string) || null;

  // Store payment_period in notes since DB has no dedicated column
  const notes = paymentPeriod ? `Период оплаты: ${paymentPeriod}` : null;

  const { error: poolError } = await supabase.from("license_pools").insert({
    software_id: software.id,
    license_type: licenseType,
    total_seats: totalSeats,
    price_per_unit: pricePerUnit,
    expires_at: expiresAt,
    notes,
  });

  if (poolError) return { error: poolError.message, code: poolError.code };
  revalidatePath("/licenses");
  revalidatePath("/dashboard");
  return { success: true };
}
