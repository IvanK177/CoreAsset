"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { employeeSchema } from "@/lib/schemas/employee.schema";

export async function createEmployee(formData: FormData) {
  const supabase = await createServiceClient();
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
  if (error) return { error: error.message, code: error.code };
  revalidatePath("/employees");
  redirect("/employees");
}

export async function updateEmployee(id: string, formData: FormData) {
  const supabase = await createServiceClient();
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
    const supabase = await createServiceClient();
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

export async function restoreEmployee(id: string) {
  let actionError: string | null = null;

  try {
    const supabase = await createServiceClient();

    const { data: workplace, error: wpError } = await supabase
      .from("workplaces")
      .select("id, computer_id")
      .eq("employee_id", id)
      .maybeSingle();

    if (wpError) {
      console.error("[restoreEmployee] Workplace query error:", wpError.message);
      // Continue — workplace might not exist
    }

    const { error: updateError } = await supabase
      .from("employees")
      .update({ is_active: true })
      .eq("id", id);

    if (updateError) {
      console.error("[restoreEmployee] Employee update error:", updateError.message);
      actionError = updateError.message;
    }

    // If employee had a computer moved to "storage" during dismissal, restore it to "active"
    if (!actionError && workplace?.computer_id) {
      const { data: computer } = await supabase
        .from("computers")
        .select("lifecycle_status")
        .eq("id", workplace.computer_id)
        .single();

      if (computer?.lifecycle_status === "storage") {
        const { error: compError } = await supabase
          .from("computers")
          .update({ lifecycle_status: "active" })
          .eq("id", workplace.computer_id);

        if (compError) {
          console.error("[restoreEmployee] Computer update error:", compError.message);
          // Non-critical — employee is already restored
        }
      }
    }
  } catch (err) {
    console.error("[restoreEmployee] Unexpected error:", err);
    actionError = "Неожиданная ошибка при восстановлении сотрудника";
  }

  if (actionError) return { error: actionError };

  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  revalidatePath("/computers");
  redirect("/employees");
}

export async function dismissEmployee(id: string) {
  let actionError: string | null = null;

  try {
    const supabase = await createServiceClient();

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

/** Non-redirecting variant — dismisses an active employee, returns result without redirect */
export async function dismissEmployeeDialog(id: string) {
  let actionError: string | null = null;

  try {
    const supabase = await createServiceClient();

    const { data: workplace, error: wpError } = await supabase
      .from("workplaces")
      .select("id, computer_id")
      .eq("employee_id", id)
      .maybeSingle();

    if (wpError) {
      console.error("[dismissEmployeeDialog] Workplace query error:", wpError.message);
    }

    const { error: updateError } = await supabase
      .from("employees")
      .update({ is_active: false })
      .eq("id", id);

    if (updateError) {
      console.error("[dismissEmployeeDialog] Employee update error:", updateError.message);
      actionError = updateError.message;
    }

    if (!actionError && workplace?.computer_id) {
      const { error: compError } = await supabase
        .from("computers")
        .update({ lifecycle_status: "storage" })
        .eq("id", workplace.computer_id);

      if (compError) {
        console.error("[dismissEmployeeDialog] Computer update error:", compError.message);
      }
    }
  } catch (err) {
    console.error("[dismissEmployeeDialog] Unexpected error:", err);
    actionError = "Неожиданная ошибка при увольнении сотрудника";
  }

  if (actionError) return { error: actionError };

  revalidatePath("/employees");
  revalidatePath("/computers");
  return { success: true };
}

/** Non-redirecting variant — restores a dismissed employee, returns result without redirect */
export async function restoreEmployeeDialog(id: string) {
  let actionError: string | null = null;

  try {
    const supabase = await createServiceClient();

    const { data: workplace, error: wpError } = await supabase
      .from("workplaces")
      .select("id, computer_id")
      .eq("employee_id", id)
      .maybeSingle();

    if (wpError) {
      console.error("[restoreEmployeeDialog] Workplace query error:", wpError.message);
    }

    const { error: updateError } = await supabase
      .from("employees")
      .update({ is_active: true })
      .eq("id", id);

    if (updateError) {
      console.error("[restoreEmployeeDialog] Employee update error:", updateError.message);
      actionError = updateError.message;
    }

    if (!actionError && workplace?.computer_id) {
      const { data: computer } = await supabase
        .from("computers")
        .select("lifecycle_status")
        .eq("id", workplace.computer_id)
        .single();

      if (computer?.lifecycle_status === "storage") {
        const { error: compError } = await supabase
          .from("computers")
          .update({ lifecycle_status: "active" })
          .eq("id", workplace.computer_id);

        if (compError) {
          console.error("[restoreEmployeeDialog] Computer update error:", compError.message);
        }
      }
    }
  } catch (err) {
    console.error("[restoreEmployeeDialog] Unexpected error:", err);
    actionError = "Неожиданная ошибка при восстановлении сотрудника";
  }

  if (actionError) return { error: actionError };

  revalidatePath("/employees");
  revalidatePath("/computers");
  return { success: true };
}

/** Non-redirecting variant — deletes an employee, returns result without redirect */
export async function deleteEmployeeDialog(id: string) {
  let deleteError: string | null = null;

  try {
    const supabase = await createServiceClient();
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) {
      console.error("[deleteEmployeeDialog] Supabase error:", error.message);
      deleteError = error.message;
    }
  } catch (err) {
    console.error("[deleteEmployeeDialog] Unexpected error:", err);
    deleteError = "Неожиданная ошибка при удалении сотрудника";
  }

  if (deleteError) return { error: deleteError };

  revalidatePath("/employees");
  revalidatePath("/dashboard");
  return { success: true };
}

/** Non-redirecting variant for dialog use — returns { success: true } or { error } */
export async function createEmployeeDialog(formData: FormData) {
  const supabase = await createServiceClient();
  const raw = {
    full_name: formData.get("full_name"),
    department: formData.get("department") || undefined,
    position: formData.get("position") || undefined,
    email: formData.get("email") || undefined,
    employee_number: formData.get("employee_number") || undefined,
  };

  const parsed = employeeSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, code: undefined };

  const { error } = await supabase.from("employees").insert(parsed.data);
  if (error) return { error: error.message, code: error.code };
  revalidatePath("/employees");
  revalidatePath("/dashboard");
  return { success: true };
}
