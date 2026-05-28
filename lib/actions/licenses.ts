"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { licenseSchema } from "@/lib/schemas/license.schema";

/** Create a license (merged table: software info + license pool in one row) */
export async function createLicense(formData: FormData) {
  const supabase = await createServiceClient();
  const parsed = licenseSchema.safeParse({
    software_name: formData.get("software_name"),
    version: formData.get("version") || undefined,
    vendor: formData.get("vendor") || undefined,
    license_type: formData.get("license_type"),
    license_key: formData.get("license_key") || undefined,
    total_seats: formData.get("total_seats"),
    price_per_unit: formData.get("price_per_unit") || 0,
    expires_at: formData.get("expires_at") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from("licenses").insert({
    ...parsed.data,
    expires_at: parsed.data.expires_at || null,
  });
  if (error) return { error: error.message, code: error.code };
  revalidateTag("licenses", { expire: 0 });
  revalidatePath("/licenses");
  revalidatePath("/dashboard");
  redirect("/licenses");
}

/** Delete a license */
export async function deleteLicense(id: string) {
  const supabase = await createServiceClient();
  await supabase.from("licenses").delete().eq("id", id);
  revalidateTag("licenses", { expire: 0 });
  revalidatePath("/licenses");
  revalidatePath("/dashboard");
  redirect("/licenses");
}

/** Non-redirecting variant for dialog use — deletes a license, returns result without redirect */
export async function deleteLicenseDialog(id: string) {
  let deleteError: string | null = null;

  try {
    const supabase = await createServiceClient();
    const { error } = await supabase.from("licenses").delete().eq("id", id);
    if (error) {
      console.error("[deleteLicenseDialog] Supabase error:", error.message);
      deleteError = error.message;
    }
  } catch (err) {
    console.error("[deleteLicenseDialog] Unexpected error:", err);
    deleteError = "Неожиданная ошибка при удалении лицензии";
  }

  if (deleteError) return { error: deleteError };

  revalidateTag("licenses", { expire: 0 });
  revalidatePath("/licenses");
  revalidatePath("/dashboard");
  return { success: true };
}

/** Install a license on a computer — inserts into computer_licenses (used_seats incremented by DB trigger) */
export async function installSoftwareDialog(computerId: string, licenseId: string, installedAt?: string) {
  const supabase = await createServiceClient();

  // Fetch the license to check seat availability
  const { data: license, error: licenseError } = await supabase
    .from("licenses")
    .select("id, used_seats, total_seats")
    .eq("id", licenseId)
    .single();

  if (licenseError || !license) return { error: "Лицензия не найдена", code: undefined };
  if (license.used_seats >= license.total_seats) return { error: "Лицензии исчерпаны", code: undefined };

  // Insert into computer_licenses
  const { error: insertError } = await supabase.from("computer_licenses").insert({
    computer_id: computerId,
    license_id: licenseId,
    installed_at: installedAt || new Date().toISOString(),
  });
  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "ПО уже установлено на этот компьютер", code: insertError.code };
    }
    return { error: insertError.message, code: insertError.code };
  }

  revalidateTag("licenses", { expire: 0 });
  revalidatePath("/computers");
  revalidatePath(`/computers/${computerId}`);
  revalidatePath("/licenses");
  revalidatePath("/dashboard");
  return { success: true };
}

/** Remove a license installation from a computer — deletes from computer_licenses (used_seats decremented by DB trigger) */
export async function removeSoftware(installationId: string, computerId: string) {
  const supabase = await createServiceClient();

  // Delete the installation
  await supabase.from("computer_licenses").delete().eq("id", installationId);

  revalidateTag("licenses", { expire: 0 });
  revalidatePath(`/computers/${computerId}`);
  revalidatePath("/licenses");
  revalidatePath("/dashboard");
}

/** Non-redirecting variant for dialog use — creates a license in one step */
export async function createLicenseDialog(formData: FormData) {
  const supabase = await createServiceClient();

  const parsed = licenseSchema.safeParse({
    software_name: formData.get("software_name"),
    version: formData.get("version") || undefined,
    vendor: formData.get("vendor") || undefined,
    license_type: formData.get("license_type") || "perpetual",
    license_key: formData.get("license_key") || undefined,
    total_seats: formData.get("total_seats") || 1,
    price_per_unit: formData.get("price_per_unit") || 0,
    expires_at: formData.get("expires_at") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message, code: undefined };

  const { error } = await supabase.from("licenses").insert({
    ...parsed.data,
    expires_at: parsed.data.expires_at || null,
  });

  if (error) return { error: error.message, code: error.code };
  revalidateTag("licenses", { expire: 0 });
  revalidatePath("/licenses");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function installMultipleSoftware(computerId: string, licenseIds: string[], installedAt?: string) {
  const supabase = await createServiceClient();

  const installDate = installedAt || new Date().toISOString();

  // Create array of inserts
  const inserts = licenseIds.map((licenseId) => ({
    computer_id: computerId,
    license_id: licenseId,
    installed_at: installDate,
  }));

  const { error } = await supabase.from("computer_licenses").insert(inserts);

  if (error) {
    console.error("[installMultipleSoftware] DB Error:", error.message);
    return { error: error.message, code: error.code };
  }

  revalidateTag("licenses", { expire: 0 });
  revalidatePath("/computers");
  revalidatePath(`/computers/${computerId}`);
  revalidatePath("/licenses");
  revalidatePath("/dashboard");
  return { success: true };
}
