"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

interface AuthResult {
  error?: string;
  success?: string;
}

/** Sign in with email + password, then redirect based on role */
export async function signIn(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: error.message };

  // Determine role from user metadata
  const role =
    data.user?.app_metadata?.role ?? data.user?.user_metadata?.role ?? "employee";
  redirect(role === "admin" ? "/dashboard" : "/portal");
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
  if (data.session) {
    const role =
      data.user?.app_metadata?.role ?? data.user?.user_metadata?.role ?? "employee";
    redirect(role === "admin" ? "/dashboard" : "/portal");
  }

  return { success: "Регистрация завершена. Проверьте email для подтверждения." };
}

/** Demo sign-in: sets cookies for demo mode and redirects based on role */
export async function demoSignIn(role: "admin" | "employee") {
  const cookieStore = await cookies();

  if (role === "admin") {
    // Try real Supabase auth for admin demo
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: "admin@corp.ru",
      password: "admin123",
    });

    if (!error) {
      // Real auth succeeded — clear demo cookie, redirect to dashboard
      cookieStore.delete("demo_role");
      cookieStore.delete("demo_employee_id");
      redirect("/dashboard");
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
