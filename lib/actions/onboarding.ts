"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/schemas/onboarding.schema";

interface OnboardingResult {
  error?: string;
}

/**
 * Completes the onboarding process for a newly registered user.
 * Creates an employee record in the `employees` table using the
 * authenticated user's ID and email, then redirects to /portal.
 */
export async function completeOnboarding(formData: FormData): Promise<OnboardingResult> {
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  // 1. Get the current authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Вы не авторизованы. Пожалуйста, войдите в систему." };
  }

  // 2. Parse and validate form data
  const raw = {
    full_name: formData.get("full_name") as string,
    position: formData.get("position") as string,
    room: (formData.get("room") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    telegram: (formData.get("telegram") as string) || undefined,
  };

  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // 3. Insert into employees table using the auth user's ID
  const { error } = await serviceClient.from("employees").insert({
    id: user.id,
    email: user.email!,
    full_name: parsed.data.full_name,
    position: parsed.data.position,
    room: parsed.data.room || null,
    phone: parsed.data.phone || null,
    telegram: parsed.data.telegram || null,
    role: "employee",
    is_active: true,
  });

  if (error) {
    // Handle duplicate insert (user already has an employee record)
    if (error.code === "23505") {
      return { error: "Профиль уже существует. Попробуйте войти в систему." };
    }
    return { error: "Ошибка при создании профиля: " + error.message };
  }

  revalidateTag("employees", { expire: 0 });
  // 4. Redirect to the employee portal
  redirect("/portal");
}