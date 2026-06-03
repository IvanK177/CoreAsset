"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

interface AuthResult {
  error?: string;
  success?: string;
}

/** Helper: fetch employee record from employees table by user id */
async function getEmployee(userId: string) {
  const supabase = createServiceClient();
  return supabase
    .from("employees")
    .select("id, full_name, role")
    .eq("id", userId)
    .single();
}

/** Helper: redirect based on whether user has a profile and their role */
async function redirectAfterAuth(userId: string): Promise<never> {
  const { data: employee } = await getEmployee(userId);

  // If user has no employee profile (or no full_name), send to onboarding
  if (!employee || !employee.full_name) {
    redirect("/onboarding");
  }

  // Has a complete profile — redirect by role
  if (employee.role === "admin") redirect("/dashboard");
  if (employee.role === "it_specialist") redirect("/it-portal");
  if (employee.role === "facilities") redirect("/facilities-portal");
  if (employee.role === "developer") redirect("/dev-portal");
  redirect("/portal");
}

/** Sign in with email + password, then redirect based on profile/role */
export async function signIn(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: error.message };

  const userId = data.user?.id;
  if (!userId) return { error: "Не удалось получить ID пользователя" };

  return await redirectAfterAuth(userId);
}

/** Sign up with email + password — redirects to onboarding for profile setup */
export async function signUp(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  // If email confirmation is required, session will be null
  if (data.user && !data.session) {
    return { success: "Письмо с подтверждением отправлено на ваш email. После подтверждения вы сможете заполнить профиль." };
  }

  // If immediately confirmed (no email verification), redirect to onboarding
  if (data.session && data.user?.id) {
    redirect("/onboarding");
  }

  return { success: "Регистрация завершена. Проверьте email для подтверждения." };
}

async function ensureAuthUserAndSignIn(
  role: "admin" | "employee" | "it_specialist" | "facilities" | "developer",
  defaultId: string,
  defaultEmail: string,
  defaultName: string
): Promise<string> {
  const serviceClient = createServiceClient();
  const cookieStore = await cookies();

  // 1. Try to find existing employee of this role
  const { data: existingEmp } = await serviceClient
    .from("employees")
    .select("id, email, full_name")
    .eq("role", role)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  let empId = defaultId;
  let empEmail = defaultEmail;
  let empName = defaultName;

  if (existingEmp) {
    empId = existingEmp.id;
    empEmail = existingEmp.email;
    empName = existingEmp.full_name;
  } else {
    // If not found in database, insert dynamic employee profile
    const { error: insertErr } = await serviceClient.from("employees").insert({
      id: empId,
      email: empEmail,
      full_name: empName,
      role: role,
      is_active: true,
      position: role === "admin" ? "Администратор" : role === "it_specialist" ? "Системный администратор" : role === "facilities" ? "Специалист АХЧ" : role === "developer" ? "Разработчик" : "Бухгалтер",
    });
    if (insertErr) {
      console.error("[ensureAuthUserAndSignIn] Error inserting employee:", insertErr.message);
    }
  }

  // 2. Ensure the user exists in auth.users with the exact same ID
  const { error: createError } = await serviceClient.auth.admin.createUser({
    id: empId,
    email: empEmail,
    password: "demo123password",
    email_confirm: true,
    app_metadata: { role: role },
    user_metadata: { role: role },
  });

  if (createError) {
    // If user already exists, update their password & metadata
    const { error: updateError } = await serviceClient.auth.admin.updateUserById(empId, {
      password: "demo123password",
      app_metadata: { role: role },
      user_metadata: { role: role },
    });
    if (updateError) {
      console.error("[ensureAuthUserAndSignIn] Error updating auth user:", updateError.message);
    }
  }

  // 3. Log the user in on the client side to write auth cookies
  const authClient = await createClient();
  const { error: signInError } = await authClient.auth.signInWithPassword({
    email: empEmail,
    password: "demo123password",
  });

  if (signInError) {
    console.error("[ensureAuthUserAndSignIn] Sign in error:", signInError.message);
  }

  // 4. Set demo cookies for backward compatibility
  cookieStore.set("demo_role", role, {
    path: "/",
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    sameSite: "lax",
  });
  cookieStore.set("demo_employee_id", empId, {
    path: "/",
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    sameSite: "lax",
  });

  return empId;
}

/** Demo sign-in: sets cookies for demo mode and redirects based on role */
export async function demoSignIn(role: "admin" | "employee" | "it_specialist" | "facilities" | "developer") {
  if (role === "admin") {
    await ensureAuthUserAndSignIn(
      "admin",
      "a0000000-0000-0000-0000-000000000001",
      "admin@corp.ru",
      "Администратор Демо"
    );
    redirect("/dashboard");
  }

  if (role === "it_specialist") {
    await ensureAuthUserAndSignIn(
      "it_specialist",
      "e0000001-0000-0000-0000-000000000001",
      "ivanov@coreasset.ru",
      "Иванов Иван Петрович"
    );
    redirect("/it-portal");
  }

  if (role === "facilities") {
    await ensureAuthUserAndSignIn(
      "facilities",
      "f0000000-0000-0000-0000-000000000001",
      "facilities@corp.ru",
      "АХЧ Специалист Демо"
    );
    redirect("/facilities-portal");
  }

  if (role === "employee") {
    await ensureAuthUserAndSignIn(
      "employee",
      "e0000001-0000-0000-0000-000000000002",
      "petrova@coreasset.ru",
      "Петрова Мария Сергеевна"
    );
    redirect("/portal");
  }

  if (role === "developer") {
    await ensureAuthUserAndSignIn(
      "developer",
      "d0000000-0000-0000-0000-000000000001",
      "developer@corp.ru",
      "Разработчик Демо"
    );
    redirect("/dev-portal");
  }
}

/** Request a password reset email link from Supabase Auth */
export async function resetPassword(email: string) {
  if (!email) {
    return { error: "Пожалуйста, введите email" };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://core-asset-api.vercel.app";

  // Request secure reset password link (does not leak if email exists or not)
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${siteUrl}/reset-password`,
  });

  if (error) {
    console.error("Reset password error:", error.message);
  }

  // Always return success to prevent user enumeration
  return {
    success: "Если этот email зарегистрирован, вы получите письмо для сброса пароля."
  };
}

