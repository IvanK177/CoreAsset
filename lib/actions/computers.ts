"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { computerSchema } from "@/lib/schemas/computer.schema";

export async function createComputer(formData: FormData) {
  const supabase = createServiceClient();
  const raw = {
    inventory_number: formData.get("inventory_number"),
    serial_number: formData.get("serial_number") || undefined,
    computer_type: formData.get("computer_type"),
    room: formData.get("room") || undefined,
    lifecycle_status: formData.get("lifecycle_status"),
    hardware: {
      cpu: formData.get("cpu") || undefined,
      ram: formData.get("ram") || undefined,
      storage: formData.get("storage") || undefined,
      gpu: formData.get("gpu") || undefined,
      mac_address: formData.get("mac_address") || undefined,
    },
    template_id: formData.get("template_id") || undefined,
  };

  const parsed = computerSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, code: undefined };

  const { hardware, ...rest } = parsed.data;
  const { error } = await supabase.from("computers").insert({
    ...rest,
    template_id: rest.template_id || null,
    hardware: hardware ?? null,
  });

  if (error) return { error: error.message, code: error.code };
  revalidateTag("computers", { expire: 0 });
  revalidatePath("/computers");
  revalidatePath("/dashboard");
  redirect("/computers");
}

export async function updateComputer(id: string, formData: FormData) {
  const supabase = createServiceClient();
  const raw = {
    inventory_number: formData.get("inventory_number"),
    serial_number: formData.get("serial_number") || undefined,
    computer_type: formData.get("computer_type"),
    room: formData.get("room") || undefined,
    lifecycle_status: formData.get("lifecycle_status"),
    hardware: {
      cpu: formData.get("cpu") || undefined,
      ram: formData.get("ram") || undefined,
      storage: formData.get("storage") || undefined,
      gpu: formData.get("gpu") || undefined,
      mac_address: formData.get("mac_address") || undefined,
    },
    template_id: formData.get("template_id") || undefined,
  };

  const parsed = computerSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, code: undefined };

  const { hardware, ...rest } = parsed.data;
  const { error } = await supabase
    .from("computers")
    .update({ ...rest, template_id: rest.template_id || null, hardware: hardware ?? null, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message, code: error.code };
  revalidateTag("computers", { expire: 0 });
  revalidatePath("/computers");
  revalidatePath(`/computers/${id}`);
  revalidatePath("/dashboard");
  redirect(`/computers/${id}`);
}

export async function deleteComputer(id: string) {
  let deleteError: string | null = null;

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("computers").delete().eq("id", id);
    if (error) {
      console.error("[deleteComputer] Supabase error:", error.message);
      deleteError = error.message;
    }
  } catch (err) {
    console.error("[deleteComputer] Unexpected error:", err);
    deleteError = "Неожиданная ошибка при удалении компьютера";
  }

  if (deleteError) return { error: deleteError };

  revalidateTag("computers", { expire: 0 });
  revalidatePath("/computers");
  revalidatePath("/dashboard");
  redirect("/computers");
}

/** Link an employee to a computer by updating employee_id — returns { success: true } or { error } */
export async function linkEmployeeToComputer(computerId: string, employeeId: string | null) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("computers")
    .update({ employee_id: employeeId, updated_at: new Date().toISOString() })
    .eq("id", computerId);

  if (error) return { error: error.message, code: error.code };

  revalidateTag("computers", { expire: 0 });
  revalidatePath("/computers");
  revalidatePath("/dashboard");
  return { success: true };
}

/** Non-redirecting variant for dialog use — returns { success: true } or { error } */
export async function updateComputerDialog(id: string, formData: FormData) {
  const supabase = createServiceClient();
  const raw = {
    inventory_number: formData.get("inventory_number"),
    serial_number: formData.get("serial_number") || undefined,
    computer_type: formData.get("computer_type"),
    room: formData.get("room") || undefined,
    lifecycle_status: formData.get("lifecycle_status"),
    hardware: {
      cpu: formData.get("cpu") || undefined,
      ram: formData.get("ram") || undefined,
      storage: formData.get("storage") || undefined,
      gpu: formData.get("gpu") || undefined,
      mac_address: formData.get("mac_address") || undefined,
    },
    template_id: formData.get("template_id") || undefined,
  };

  const parsed = computerSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, code: undefined };

  const { hardware, ...rest } = parsed.data;
  const { error } = await supabase
    .from("computers")
    .update({ ...rest, template_id: rest.template_id || null, hardware: hardware ?? null, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message, code: error.code };

  revalidateTag("computers", { expire: 0 });
  revalidatePath("/computers");
  revalidatePath(`/computers/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

/** Non-redirecting variant for dialog use — returns { success: true } or { error } */
export async function createComputerDialog(formData: FormData) {
  const supabase = createServiceClient();
  const raw = {
    inventory_number: formData.get("inventory_number"),
    serial_number: formData.get("serial_number") || undefined,
    computer_type: formData.get("computer_type"),
    room: formData.get("room") || undefined,
    lifecycle_status: formData.get("lifecycle_status"),
    hardware: {
      cpu: formData.get("cpu") || undefined,
      ram: formData.get("ram") || undefined,
      storage: formData.get("storage") || undefined,
      gpu: formData.get("gpu") || undefined,
      mac_address: formData.get("mac_address") || undefined,
    },
    template_id: formData.get("template_id") || undefined,
  };

  const parsed = computerSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, code: undefined };

  const { hardware, ...rest } = parsed.data;
  const { error } = await supabase.from("computers").insert({
    ...rest,
    template_id: rest.template_id || null,
    hardware: hardware ?? null,
  });

  if (error) return { error: error.message, code: error.code };
  revalidateTag("computers", { expire: 0 });
  revalidatePath("/computers");
  revalidatePath("/dashboard");
  return { success: true };
}
