"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

interface SignUpResult {
  error?: string;
}

/**
 * Self-registration action: validates email + password and saves it
 * in a temporary secure cookie, then redirects to /onboarding.
 * Actual creation in Supabase auth is deferred to onboarding completion.
 */
export async function signUpAction(formData: FormData): Promise<SignUpResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  // Basic validation
  if (!email || !password) {
    return { error: "Email и пароль — обязательные поля" };
  }

  if (password !== confirmPassword) {
    return { error: "Пароли не совпадают" };
  }

  if (password.length < 6) {
    return { error: "Пароль должен содержать минимум 6 символов" };
  }

  // Check if a completed employee profile already exists with this email
  const serviceClient = createServiceClient();
  const { data: existingEmployees, error: dbError } = await serviceClient
    .from("employees")
    .select("id, full_name")
    .eq("email", email)
    .limit(1);

  if (dbError) {
    return { error: "Ошибка базы данных: " + dbError.message };
  }

  if (existingEmployees && existingEmployees.length > 0 && existingEmployees[0].full_name) {
    return { error: "Пользователь с таким email уже зарегистрирован. Пожалуйста, войдите в систему." };
  }

  // Save registration credentials to a secure cookie for the onboarding step
  const cookieStore = await cookies();
  cookieStore.set("pending_reg", JSON.stringify({ email, password }), {
    path: "/",
    maxAge: 3600, // 1 hour
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  redirect("/onboarding");
}