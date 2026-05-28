"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { employeeSchema, employeeUpdateSchema } from "@/lib/schemas/employee.schema";

export async function createEmployee(formData: FormData) {
  const supabase = await createServiceClient();
  const raw = {
    full_name: formData.get("full_name"),
    position: formData.get("position") || undefined,
    email: formData.get("email") || undefined,
    room: formData.get("room") || undefined,
    phone: formData.get("phone") || undefined,
    telegram: formData.get("telegram") || undefined,
    role: formData.get("role") || undefined,
    is_active: true,
  };

  const parsed = employeeSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // 1. Create auth user first — employees.id must match auth.users.id
  const email = parsed.data.email;
  if (!email) return { error: "Email обязателен для создания сотрудника (используется как логин)" };

  // Generate a random temporary password (user should change it on first login)
  const tempPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2).toUpperCase();

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true, // auto-confirm so user can log in immediately
  });

  if (authError) return { error: authError.message, code: authError.code };
  if (!authData.user) return { error: "Не удалось создать пользователя в auth" };

  const userId = authData.user.id;

  // 2. Insert into employees table using the auth user id
  const { error: dbError } = await supabase.from("employees").insert({
    ...parsed.data,
    id: userId,
  });

  // 3. ROLLBACK: If DB insert failed — delete the "ghost" from Auth
  if (dbError) {
    console.error("[createEmployee] DB Error:", dbError.message);
    await supabase.auth.admin.deleteUser(userId);
    return { error: "Ошибка при сохранении в БД: " + dbError.message, code: dbError.code };
  }

  revalidateTag("employees", { expire: 0 });
  revalidatePath("/employees");
  redirect("/employees");
}

export async function updateEmployee(id: string, formData: FormData) {
  const supabase = await createServiceClient();
  const raw = {
    full_name: formData.get("full_name"),
    position: formData.get("position") || undefined,
    email: formData.get("email") || undefined,
    room: formData.get("room") || undefined,
    phone: formData.get("phone") || undefined,
    telegram: formData.get("telegram") || undefined,
    role: formData.get("role") || undefined,
  };

  const parsed = employeeUpdateSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase
    .from("employees")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidateTag("employees", { expire: 0 });
  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  redirect(`/employees/${id}`);
}

export async function deleteEmployee(id: string) {
  let deleteError: string | null = null;

  try {
    const supabase = await createServiceClient();

    // 1. Delete from employees table
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) {
      console.error("[deleteEmployee] Supabase error:", error.message);
      deleteError = error.message;
    }

    // 2. Delete auth user account to free up the email
    if (!deleteError) {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);
      if (authDeleteError) {
        console.error("[deleteEmployee] Auth delete error:", authDeleteError.message);
        // Non-critical: employee row is already gone, but auth account remains
        // We don't fail the whole operation because the employee record is deleted
      }
    }
  } catch (err) {
    console.error("[deleteEmployee] Unexpected error:", err);
    deleteError = "Неожиданная ошибка при удалении сотрудника";
  }

  if (deleteError) return { error: deleteError };

  revalidateTag("employees", { expire: 0 });
  revalidatePath("/employees");
  redirect("/employees");
}

export async function restoreEmployee(id: string) {
  let actionError: string | null = null;

  try {
    const supabase = await createServiceClient();

    // Find computers assigned to this employee via computers.employee_id
    const { data: computers } = await supabase
      .from("computers")
      .select("id, lifecycle_status")
      .eq("employee_id", id);

    const { error: updateError } = await supabase
      .from("employees")
      .update({ is_active: true })
      .eq("id", id);

    if (updateError) {
      console.error("[restoreEmployee] Employee update error:", updateError.message);
      actionError = updateError.message;
    }

    // If employee had a computer moved to "storage" during dismissal, restore it to "active"
    if (!actionError && computers) {
      for (const comp of computers) {
        if (comp.lifecycle_status === "storage") {
          const { error: compError } = await supabase
            .from("computers")
            .update({ lifecycle_status: "active" })
            .eq("id", comp.id);

          if (compError) {
            console.error("[restoreEmployee] Computer update error:", compError.message);
          }
        }
      }
    }
  } catch (err) {
    console.error("[restoreEmployee] Unexpected error:", err);
    actionError = "Неожиданная ошибка при восстановлении сотрудника";
  }

  if (actionError) return { error: actionError };

  revalidateTag("employees", { expire: 0 });
  revalidateTag("computers", { expire: 0 });
  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  revalidatePath("/computers");
  redirect("/employees");
}

export async function dismissEmployee(id: string) {
  let actionError: string | null = null;

  try {
    const supabase = await createServiceClient();

    // Find computers assigned to this employee via computers.employee_id
    const { data: computers } = await supabase
      .from("computers")
      .select("id")
      .eq("employee_id", id);

    const { error: updateError } = await supabase
      .from("employees")
      .update({ is_active: false })
      .eq("id", id);

    if (updateError) {
      console.error("[dismissEmployee] Employee update error:", updateError.message);
      actionError = updateError.message;
    }

    // Move assigned computers to "storage" (ON DELETE SET NULL on employee_id will clear it)
    // But we explicitly set lifecycle_status to "storage" and clear employee_id
    if (!actionError && computers) {
      for (const comp of computers) {
        const { error: compError } = await supabase
          .from("computers")
          .update({ lifecycle_status: "storage", employee_id: null })
          .eq("id", comp.id);

        if (compError) {
          console.error("[dismissEmployee] Computer update error:", compError.message);
        }
      }
    }
  } catch (err) {
    console.error("[dismissEmployee] Unexpected error:", err);
    actionError = "Неожиданная ошибка при увольнении сотрудника";
  }

  if (actionError) return { error: actionError };

  revalidateTag("employees", { expire: 0 });
  revalidateTag("computers", { expire: 0 });
  revalidatePath("/employees");
  revalidatePath("/computers");
  redirect("/employees");
}

/** Non-redirecting variant — dismisses an active employee, returns result without redirect */
export async function dismissEmployeeDialog(id: string) {
  let actionError: string | null = null;

  try {
    const supabase = await createServiceClient();

    const { data: computers } = await supabase
      .from("computers")
      .select("id")
      .eq("employee_id", id);

    const { error: updateError } = await supabase
      .from("employees")
      .update({ is_active: false })
      .eq("id", id);

    if (updateError) {
      console.error("[dismissEmployeeDialog] Employee update error:", updateError.message);
      actionError = updateError.message;
    }

    if (!actionError && computers) {
      for (const comp of computers) {
        const { error: compError } = await supabase
          .from("computers")
          .update({ lifecycle_status: "storage", employee_id: null })
          .eq("id", comp.id);

        if (compError) {
          console.error("[dismissEmployeeDialog] Computer update error:", compError.message);
        }
      }
    }
  } catch (err) {
    console.error("[dismissEmployeeDialog] Unexpected error:", err);
    actionError = "Неожиданная ошибка при увольнении сотрудника";
  }

  if (actionError) return { error: actionError };

  revalidateTag("employees", { expire: 0 });
  revalidateTag("computers", { expire: 0 });
  revalidatePath("/employees");
  revalidatePath("/computers");
  return { success: true };
}

/** Non-redirecting variant — restores a dismissed employee, returns result without redirect */
export async function restoreEmployeeDialog(id: string) {
  let actionError: string | null = null;

  try {
    const supabase = await createServiceClient();

    // Note: after dismissal, employee_id on computers is set to null,
    // so we can't find computers by employee_id. We skip computer restoration here.
    const { error: updateError } = await supabase
      .from("employees")
      .update({ is_active: true })
      .eq("id", id);

    if (updateError) {
      console.error("[restoreEmployeeDialog] Employee update error:", updateError.message);
      actionError = updateError.message;
    }
  } catch (err) {
    console.error("[restoreEmployeeDialog] Unexpected error:", err);
    actionError = "Неожиданная ошибка при восстановлении сотрудника";
  }

  if (actionError) return { error: actionError };

  revalidateTag("employees", { expire: 0 });
  revalidatePath("/employees");
  revalidatePath("/computers");
  return { success: true };
}

/** Non-redirecting variant — deletes an employee AND their auth account, returns result without redirect */
export async function deleteEmployeeDialog(id: string) {
  let deleteError: string | null = null;

  try {
    const supabase = await createServiceClient();

    // 1. Delete from employees table
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) {
      console.error("[deleteEmployeeDialog] Supabase error:", error.message);
      deleteError = error.message;
    }

    // 2. Delete auth user account to free up the email
    if (!deleteError) {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);
      if (authDeleteError) {
        console.error("[deleteEmployeeDialog] Auth delete error:", authDeleteError.message);
        // Non-critical: employee row is already gone, but auth account remains
      }
    }
  } catch (err) {
    console.error("[deleteEmployeeDialog] Unexpected error:", err);
    deleteError = "Неожиданная ошибка при удалении сотрудника";
  }

  if (deleteError) return { error: deleteError };

  revalidateTag("employees", { expire: 0 });
  revalidatePath("/employees");
  revalidatePath("/dashboard");
  return { success: true };
}

/** Non-redirecting variant for dialog use — returns { success: true } or { error } */
export async function createEmployeeDialog(formData: FormData) {
  const supabase = await createServiceClient();
  const raw = {
    full_name: formData.get("full_name"),
    position: formData.get("position") || undefined,
    email: formData.get("email") || undefined,
    room: formData.get("room") || undefined,
    phone: formData.get("phone") || undefined,
    telegram: formData.get("telegram") || undefined,
    role: formData.get("role") || undefined,
    is_active: true,
  };

  const parsed = employeeSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, code: undefined };

  // 1. Create auth user first — employees.id must match auth.users.id
  const email = parsed.data.email;
  if (!email) return { error: "Email обязателен для создания сотрудника (используется как логин)", code: undefined };

  // Generate a random temporary password
  const tempPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2).toUpperCase();

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (authError) return { error: authError.message, code: authError.code ?? undefined };
  if (!authData.user) return { error: "Не удалось создать пользователя в auth", code: undefined };

  const userId = authData.user.id;

  // 2. Insert into employees table using the auth user id
  const { error: dbError } = await supabase.from("employees").insert({
    ...parsed.data,
    id: userId,
  });

  // 3. ROLLBACK: If DB insert failed — delete the "ghost" from Auth
  if (dbError) {
    console.error("[createEmployeeDialog] DB Error:", dbError.message);
    await supabase.auth.admin.deleteUser(userId);
    return { error: "Ошибка при сохранении в БД: " + dbError.message, code: dbError.code };
  }

  revalidateTag("employees", { expire: 0 });
  revalidatePath("/employees");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateEmployeeRole(id: string, role: "admin" | "employee" | "it_specialist") {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("employees")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[updateEmployeeRole] DB Error:", error.message);
    return { error: error.message };
  }

  revalidateTag("employees", { expire: 0 });
  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}
