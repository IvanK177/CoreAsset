"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { deviceSchema } from "@/lib/schemas/device.schema";

export async function createDevice(formData: FormData) {
  const supabase = createServiceClient();
  const raw = {
    inventory_number: formData.get("inventory_number"),
    serial_number: formData.get("serial_number") || undefined,
    computer_type: formData.get("computer_type"),
    room: formData.get("room") || undefined,
    lifecycle_status: formData.get("lifecycle_status"),
    device_type: formData.get("device_type"),
    hardware: {
      cpu: formData.get("cpu") || undefined,
      ram: formData.get("ram") || undefined,
      storage: formData.get("storage") || undefined,
      gpu: formData.get("gpu") || undefined,
      mac_address: formData.get("mac_address") || undefined,
      diagonal: formData.get("diagonal") || undefined,
      resolution: formData.get("resolution") || undefined,
    },
    template_id: formData.get("template_id") || undefined,
    photo_urls: formData.get("photo_urls") ? JSON.parse(formData.get("photo_urls") as string) : undefined,
  };

  const parsed = deviceSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, code: undefined };

  const { hardware, ...rest } = parsed.data;
  const { error } = await supabase.from("devices").insert({
    ...rest,
    template_id: rest.template_id || null,
    hardware: hardware ?? null,
  });

  if (error) return { error: error.message, code: error.code };
  revalidateTag("devices", { expire: 0 });
  revalidatePath("/devices");
  revalidatePath("/dashboard");
  redirect("/devices");
}

export async function updateDevice(id: string, formData: FormData) {
  const supabase = createServiceClient();
  const raw = {
    inventory_number: formData.get("inventory_number"),
    serial_number: formData.get("serial_number") || undefined,
    computer_type: formData.get("computer_type"),
    room: formData.get("room") || undefined,
    lifecycle_status: formData.get("lifecycle_status"),
    device_type: formData.get("device_type"),
    hardware: {
      cpu: formData.get("cpu") || undefined,
      ram: formData.get("ram") || undefined,
      storage: formData.get("storage") || undefined,
      gpu: formData.get("gpu") || undefined,
      mac_address: formData.get("mac_address") || undefined,
      diagonal: formData.get("diagonal") || undefined,
      resolution: formData.get("resolution") || undefined,
    },
    template_id: formData.get("template_id") || undefined,
    photo_urls: formData.get("photo_urls") ? JSON.parse(formData.get("photo_urls") as string) : undefined,
  };

  const parsed = deviceSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, code: undefined };

  const { hardware, ...rest } = parsed.data;
  const { error } = await supabase
    .from("devices")
    .update({ ...rest, template_id: rest.template_id || null, hardware: hardware ?? null, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message, code: error.code };
  revalidateTag("devices", { expire: 0 });
  revalidatePath("/devices");
  revalidatePath(`/devices/${id}`);
  revalidatePath("/dashboard");
  redirect(`/devices/${id}`);
}

export async function deleteDevice(id: string) {
  let deleteError: string | null = null;

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("devices").delete().eq("id", id);
    if (error) {
      console.error("[deleteDevice] Supabase error:", error.message);
      deleteError = error.message;
    }
  } catch (err) {
    console.error("[deleteDevice] Unexpected error:", err);
    deleteError = "Неожиданная ошибка при удалении устройства";
  }

  if (deleteError) return { error: deleteError };

  revalidateTag("devices", { expire: 0 });
  revalidatePath("/devices");
  revalidatePath("/dashboard");
  redirect("/devices");
}

export async function linkEmployeeToDevice(deviceId: string, employeeId: string | null) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("devices")
    .update({ employee_id: employeeId, updated_at: new Date().toISOString() })
    .eq("id", deviceId);

  if (error) return { error: error.message, code: error.code };

  revalidateTag("devices", { expire: 0 });
  revalidatePath("/devices");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateDeviceDialog(id: string, formData: FormData) {
  const supabase = createServiceClient();
  const raw = {
    inventory_number: formData.get("inventory_number"),
    serial_number: formData.get("serial_number") || undefined,
    computer_type: formData.get("computer_type"),
    room: formData.get("room") || undefined,
    lifecycle_status: formData.get("lifecycle_status"),
    device_type: formData.get("device_type"),
    hardware: {
      cpu: formData.get("cpu") || undefined,
      ram: formData.get("ram") || undefined,
      storage: formData.get("storage") || undefined,
      gpu: formData.get("gpu") || undefined,
      mac_address: formData.get("mac_address") || undefined,
      diagonal: formData.get("diagonal") || undefined,
      resolution: formData.get("resolution") || undefined,
    },
    template_id: formData.get("template_id") || undefined,
    photo_urls: formData.get("photo_urls") ? JSON.parse(formData.get("photo_urls") as string) : undefined,
  };

  const parsed = deviceSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, code: undefined };

  const { hardware, ...rest } = parsed.data;
  const { error } = await supabase
    .from("devices")
    .update({ ...rest, template_id: rest.template_id || null, hardware: hardware ?? null, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message, code: error.code };

  revalidateTag("devices", { expire: 0 });
  revalidatePath("/devices");
  revalidatePath(`/devices/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createDeviceDialog(formData: FormData) {
  const supabase = createServiceClient();
  const raw = {
    inventory_number: formData.get("inventory_number"),
    serial_number: formData.get("serial_number") || undefined,
    computer_type: formData.get("computer_type"),
    room: formData.get("room") || undefined,
    lifecycle_status: formData.get("lifecycle_status"),
    device_type: formData.get("device_type"),
    hardware: {
      cpu: formData.get("cpu") || undefined,
      ram: formData.get("ram") || undefined,
      storage: formData.get("storage") || undefined,
      gpu: formData.get("gpu") || undefined,
      mac_address: formData.get("mac_address") || undefined,
      diagonal: formData.get("diagonal") || undefined,
      resolution: formData.get("resolution") || undefined,
    },
    template_id: formData.get("template_id") || undefined,
    photo_urls: formData.get("photo_urls") ? JSON.parse(formData.get("photo_urls") as string) : undefined,
  };

  const parsed = deviceSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, code: undefined };

  const { hardware, ...rest } = parsed.data;
  const { error } = await supabase.from("devices").insert({
    ...rest,
    template_id: rest.template_id || null,
    hardware: hardware ?? null,
  });

  if (error) return { error: error.message, code: error.code };
  revalidateTag("devices", { expire: 0 });
  revalidatePath("/devices");
  revalidatePath("/dashboard");
  return { success: true };
}
