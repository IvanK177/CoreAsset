"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });
  if (error) return { error: error.message };
  redirect("/dashboard");
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
