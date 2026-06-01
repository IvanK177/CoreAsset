"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/schemas/onboarding.schema";

interface OnboardingResult {
  error?: string;
  success?: boolean;
  message?: string;
}

/**
 * Completes the onboarding process for a newly registered user.
 * If registration is pending, creates the user account in Supabase auth first.
 * Then creates an employee record in the `employees` table.
 */
export async function completeOnboarding(formData: FormData): Promise<OnboardingResult> {
  const supabase = await createClient();
  const serviceClient = createServiceClient();
  const cookieStore = await cookies();

  // 1. Get the current authenticated user or check pending registration
  let { data: { user } } = await supabase.auth.getUser();
  let email = "";
  let password = "";
  let isPendingReg = false;

  if (!user) {
    const pendingRegCookie = cookieStore.get("pending_reg")?.value;
    if (pendingRegCookie) {
      try {
        const pending = JSON.parse(pendingRegCookie);
        email = pending.email;
        password = pending.password;
        isPendingReg = true;
      } catch {
        return { error: "Ошибка сессии регистрации. Пожалуйста, зарегистрируйтесь заново." };
      }
    } else {
      return { error: "Вы не авторизованы. Пожалуйста, войдите в систему." };
    }
  } else {
    email = user.email!;
  }

  // 2. Parse and validate form data
  const raw = {
    full_name: formData.get("full_name") as string,
    position: formData.get("position") as string,
    building: formData.get("building") as string,
    room: (formData.get("room") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    telegram: (formData.get("telegram") as string) || undefined,
  };

  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // 3. If registration is pending, sign up the user in Supabase auth first
  if (isPendingReg) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      },
    });

    if (signUpError) {
      // Check if user is already registered in auth.users (e.g., legacy user or duplicate sign up)
      // Attempt login to verify credentials and proceed
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signInError && signInData.user?.id) {
        user = signInData.user;
      } else {
        return { error: "Ошибка регистрации в Supabase: " + signUpError.message };
      }
    } else if (signUpData.user) {
      user = signUpData.user;

      // If email confirmation is required and no session is returned
      if (!signUpData.session) {
        // Insert record in employees table using the newly created user ID
        const { error: insertError } = await serviceClient.from("employees").insert({
          id: user.id,
          email: email,
          full_name: parsed.data.full_name,
          position: parsed.data.position,
          building: parsed.data.building,
          room: parsed.data.room || null,
          phone: parsed.data.phone || null,
          telegram: parsed.data.telegram || null,
          role: (user.app_metadata?.role ?? user.user_metadata?.role ?? "employee") as "admin" | "employee" | "it_specialist",
          is_active: true,
        });

        if (insertError) {
          // Rollback the created auth user
          await serviceClient.auth.admin.deleteUser(user.id);
          if (insertError.code === "23505") {
            return { error: "Профиль уже существует. Попробуйте войти в систему." };
          }
          return { error: "Ошибка при создании профиля: " + insertError.message };
        }

        // Clean up pending cookie
        cookieStore.delete("pending_reg");
        revalidateTag("employees", { expire: 0 });

        return {
          success: true,
          message: "Письмо с подтверждением отправлено на ваш email. Подтвердите его, затем войдите в систему.",
        };
      }
    } else {
      return { error: "Не удалось получить ID созданного пользователя." };
    }
  }

  if (!user) {
    return { error: "Пользователь не авторизован." };
  }

  // 4. Insert into employees table using the auth user's ID
  const { error: dbError } = await serviceClient.from("employees").insert({
    id: user.id,
    email: email,
    full_name: parsed.data.full_name,
    position: parsed.data.position,
    building: parsed.data.building,
    room: parsed.data.room || null,
    phone: parsed.data.phone || null,
    telegram: parsed.data.telegram || null,
    role: (user.app_metadata?.role ?? user.user_metadata?.role ?? "employee") as "admin" | "employee" | "it_specialist",
    is_active: true,
  });

  if (dbError) {
    // Rollback auth user if we just created it
    if (isPendingReg && user?.id) {
      await serviceClient.auth.admin.deleteUser(user.id);
    }
    if (dbError.code === "23505") {
      return { error: "Профиль уже существует. Попробуйте войти в систему." };
    }
    return { error: "Ошибка при создании профиля: " + dbError.message };
  }

  // 5. Clean up pending registration cookie
  if (isPendingReg) {
    cookieStore.delete("pending_reg");
  }

  revalidateTag("employees", { expire: 0 });

  // 6. Redirect to the employee portal
  redirect("/portal");
}