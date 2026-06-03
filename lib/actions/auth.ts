"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Shared sign-out action used by Sidebar and PortalHeader.
 * Clears the Supabase session, all auth cookies, and demo cookies,
 * then redirects to /login.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Clear all auth, demo, and pending registration cookies explicitly
  const cookieStore = await cookies();
  cookieStore.delete("demo_role");
  cookieStore.delete("demo_employee_id");
  cookieStore.delete("pending_reg");

  // Delete all Supabase auth cookies (sb-* prefix)
  const allCookies = cookieStore.getAll();
  allCookies.forEach((cookie) => {
    if (cookie.name.startsWith("sb-")) {
      cookieStore.delete(cookie.name);
    }
  });

  redirect("/login");
}

/**
 * Custom back action for the onboarding page.
 * If registration is pending, deletes the registration cookie and redirects back to /register.
 * If the user is fully logged in, logs them out and redirects to /login.
 */
export async function goBackFromOnboarding() {
  const cookieStore = await cookies();
  const hasPending = cookieStore.has("pending_reg");

  if (hasPending) {
    cookieStore.delete("pending_reg");
    redirect("/register");
  } else {
    await signOut();
  }
}

/**
 * Validates the user's session and role.
 * Supports both standard Supabase sessions and demo modes.
 */
export async function requireAuth(requiredRoles?: string[]): Promise<{ user: any; role: string }> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const demoRole = cookieStore.get("demo_role")?.value;
  const demoEmployeeId = cookieStore.get("demo_employee_id")?.value;

  if ((error || !user) && !demoEmployeeId) {
    redirect("/login");
  }

  const userId = user?.id || demoEmployeeId;
  if (!userId) {
    redirect("/login");
  }

  let role = demoRole || null;

  if (!role) {
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("role")
      .eq("id", userId)
      .single();

    if (empError || !employee) {
      throw new Error("Профиль пользователя не найден");
    }
    role = employee.role as string;
  }

  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(role)) {
    throw new Error(`Доступ запрещен: требуется роль ${requiredRoles.join(" или ")}`);
  }

  return { user: user || { id: userId, email: "demo@corp.ru" }, role };
}