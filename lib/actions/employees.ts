"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { employeeSchema } from "@/lib/schemas/employee.schema";

export async function createEmployee(formData: FormData) {
  const supabase = await createClient();
  const raw = {
    full_name: formData.get("full_name"),
    department: formData.get("department") || undefined,
    position: formData.get("position") || undefined,
    email: formData.get("email") || undefined,
    employee_number: formData.get("employee_number") || undefined,
  };

  const parsed = employeeSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from("employees").insert(parsed.data);
  if (error) return { error: error.message };
  revalidatePath("/employees");
  redirect("/employees");
}

export async function updateEmployee(id: string, formData: FormData) {
  const supabase = await createClient();
  const raw = {
    full_name: formData.get("full_name"),
    department: formData.get("department") || undefined,
    position: formData.get("position") || undefined,
    email: formData.get("email") || undefined,
    employee_number: formData.get("employee_number") || undefined,
  };

  const parsed = employeeSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase
    .from("employees")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  redirect(`/employees/${id}`);
}

export async function deleteEmployee(id: string) {
  let deleteError: string | null = null;

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) {
      console.error("[deleteEmployee] Supabase error:", error.message);
      deleteError = error.message;
    }
  } catch (err) {
    console.error("[deleteEmployee] Unexpected error:", err);
    deleteError = "Неожиданная ошибка при удалении сотрудника";
  }

  if (deleteError) return { error: deleteError };

  revalidatePath("/employees");
  redirect("/employees");
}

export async function dismissEmployee(id: string) {
  let actionError: string | null = null;

  try {
    const supabase = await createClient();

    const { data: workplace, error: wpError } = await supabase
      .from("workplaces")
      .select("id, computer_id")
      .eq("employee_id", id)
      .maybeSingle();

    if (wpError) {
      console.error("[dismissEmployee] Workplace query error:", wpError.message);
      // Continue — workplace might not exist
    }

    const { error: updateError } = await supabase
      .from("employees")
      .update({ is_active: false })
      .eq("id", id);

    if (updateError) {
      console.error("[dismissEmployee] Employee update error:", updateError.message);
      actionError = updateError.message;
    }

    if (!actionError && workplace?.computer_id) {
      const { error: compError } = await supabase
        .from("computers")
        .update({ lifecycle_status: "storage" })
        .eq("id", workplace.computer_id);

      if (compError) {
        console.error("[dismissEmployee] Computer update error:", compError.message);
        // Non-critical — employee is already dismissed
      }
    }
  } catch (err) {
    console.error("[dismissEmployee] Unexpected error:", err);
    actionError = "Неожиданная ошибка при увольнении сотрудника";
  }

  if (actionError) return { error: actionError };

  revalidatePath("/employees");
  revalidatePath("/computers");
  redirect("/employees");
}
