"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface SignUpResult {
  error?: string;
}

/**
 * Self-registration action: signs up a new user with email + password.
 * After successful registration (and auto-login), redirects to /onboarding
 * so the user can fill in their profile.
 */
export async function signUpAction(formData: FormData): Promise<SignUpResult> {
  const supabase = await createClient();

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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If email confirmation is required, session will be null
  if (data.user && !data.session) {
    return { error: "Письмо с подтверждением отправлено на ваш email. Подвердите его, затем войдите в систему и заполните профиль." };
  }

  // If immediately confirmed (no email verification), redirect to onboarding
  if (data.session && data.user?.id) {
    redirect("/onboarding");
  }

  // Fallback — shouldn't normally reach here
  return { error: "Неожиданный результат регистрации. Попробуйте войти." };
}