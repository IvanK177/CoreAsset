"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

interface AuthResult {
  error?: string;
  success?: string;
}

/** Helper: fetch role from employees table by user id, with fallbacks */
async function getUserRole(userId: string): Promise<string> {
  const supabase = createServiceClient();
  const { data: employee } = await supabase
    .from("employees")
    .select("role")
    .eq("id", userId)
    .single();

  if (employee?.role) return employee.role;

  // Fallback: try matching by email (legacy compatibility)
  // This shouldn't normally be needed since the PostgreSQL trigger
  // syncs auth.users.id → employees.id, but kept as safety net
  return "employee";
}

/** Helper: redirect to the correct home page based on role — always throws (never returns) */
function redirectByRole(role: string): never {
  if (role === "admin") redirect("/dashboard");
  if (role === "it_specialist") redirect("/it-portal");
  redirect("/portal");
}

/** Sign in with email + password, then redirect based on role from employees table */
export async function signIn(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: error.message };

  // Get user id and query role from employees table
  const userId = data.user?.id;
  if (!userId) return { error: "Не удалось получить ID пользователя" };

  const role = await getUserRole(userId);
  redirectByRole(role);
}

/** Sign up with email + password */
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
    return { success: "Письмо с подтверждением отправлено на ваш email." };
  }

  // If immediately confirmed (no email verification), redirect based on role
  if (data.session && data.user?.id) {
    const role = await getUserRole(data.user.id);
    redirectByRole(role);
  }

  return { success: "Регистрация завершена. Проверьте email для подтверждения." };
}

/** Demo sign-in: sets cookies for demo mode and redirects based on role */
export async function demoSignIn(role: "admin" | "employee" | "it_specialist") {
  const cookieStore = await cookies();

  if (role === "admin") {
    // Try real Supabase auth for admin demo
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "admin@corp.ru",
      password: "admin123",
    });

    if (!error && data.user?.id) {
      // Real auth succeeded — query role from employees table
      const dbRole = await getUserRole(data.user.id);
      cookieStore.delete("demo_role");
      cookieStore.delete("demo_employee_id");
      redirectByRole(dbRole);
    }

    // Real auth failed — use demo cookie mode
    cookieStore.set("demo_role", "admin", {
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true,
      sameSite: "lax",
    });
    cookieStore.delete("demo_employee_id");
    redirect("/dashboard");
  }

  // IT specialist demo — cookie-based demo mode
  if (role === "it_specialist") {
    cookieStore.set("demo_role", "it_specialist", {
      path: "/",
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      sameSite: "lax",
    });
    // Try to find an IT specialist employee in the database
    const supabase = createServiceClient();
    const { data: specialist } = await supabase
      .from("employees")
      .select("id")
      .eq("role", "it_specialist")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (specialist) {
      cookieStore.set("demo_employee_id", specialist.id, {
        path: "/",
        maxAge: 60 * 60 * 24,
        httpOnly: true,
        sameSite: "lax",
      });
    }
    redirect("/it-portal");
  }

  // Employee demo — always use cookie-based demo mode
  cookieStore.set("demo_role", "employee", {
    path: "/",
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    sameSite: "lax",
  });
  // Hardcoded demo employee ID (Иванов Иван Петрович from seed data)
  cookieStore.set("demo_employee_id", "e0000001-0000-0000-0000-000000000001", {
    path: "/",
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    sameSite: "lax",
  });
  redirect("/portal");
}
