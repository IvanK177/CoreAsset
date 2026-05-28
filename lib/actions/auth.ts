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