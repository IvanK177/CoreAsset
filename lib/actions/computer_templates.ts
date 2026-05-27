"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { computerTemplateSchema } from "@/lib/schemas/computer_template.schema";

export async function createTemplate(formData: FormData) {
  const supabase = createServiceClient();
  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    computer_type: formData.get("computer_type"),
    hardware: {
      cpu: formData.get("cpu") || undefined,
      ram: formData.get("ram") || undefined,
      storage: formData.get("storage") || undefined,
      gpu: formData.get("gpu") || undefined,
      mac_address: formData.get("mac_address") || undefined,
    },
  };

  const parsed = computerTemplateSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from("computer_templates").insert({
    name: parsed.data.name,
    description: parsed.data.description || null,
    computer_type: parsed.data.computer_type || null,
    hardware: parsed.data.hardware ?? null,
  });

  if (error) return { error: error.message };

  revalidateTag("templates", { expire: 0 });
  revalidatePath("/templates");
  revalidatePath("/computers");
  redirect("/templates");
}

export async function updateTemplate(id: string, formData: FormData) {
  const supabase = createServiceClient();
  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    computer_type: formData.get("computer_type"),
    hardware: {
      cpu: formData.get("cpu") || undefined,
      ram: formData.get("ram") || undefined,
      storage: formData.get("storage") || undefined,
      gpu: formData.get("gpu") || undefined,
      mac_address: formData.get("mac_address") || undefined,
    },
  };

  const parsed = computerTemplateSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase
    .from("computer_templates")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      computer_type: parsed.data.computer_type || null,
      hardware: parsed.data.hardware ?? null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateTag("templates", { expire: 0 });
  revalidatePath("/templates");
  revalidatePath("/computers");
  redirect("/templates");
}

export async function deleteTemplate(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("computer_templates").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidateTag("templates", { expire: 0 });
  revalidatePath("/templates");
  revalidatePath("/computers");
  redirect("/templates");
}

export async function deleteTemplateDialog(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("computer_templates").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidateTag("templates", { expire: 0 });
  revalidatePath("/templates");
  revalidatePath("/computers");
  return { success: true };
}
