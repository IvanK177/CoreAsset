"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computerSchema } from "@/lib/schemas/computer.schema";

export async function createComputer(formData: FormData) {
  const supabase = await createClient();
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
    },
  };

  const parsed = computerSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { hardware, ...rest } = parsed.data;
  const { error } = await supabase.from("computers").insert({
    ...rest,
    hardware: hardware ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/computers");
  redirect("/computers");
}

export async function updateComputer(id: string, formData: FormData) {
  const supabase = await createClient();
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
    },
  };

  const parsed = computerSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { hardware, ...rest } = parsed.data;
  const { error } = await supabase
    .from("computers")
    .update({ ...rest, hardware: hardware ?? null, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/computers");
  revalidatePath(`/computers/${id}`);
  redirect(`/computers/${id}`);
}

export async function deleteComputer(id: string) {
  let deleteError: string | null = null;

  try {
    const supabase = await createClient();
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

  revalidatePath("/computers");
  redirect("/computers");
}
