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

  // Clear all auth and demo cookies explicitly
  const cookieStore = await cookies();
  cookieStore.delete("demo_role");
  cookieStore.delete("demo_employee_id");

  // Delete all Supabase auth cookies (sb-* prefix)
  const allCookies = cookieStore.getAll();
  allCookies.forEach((cookie) => {
    if (cookie.name.startsWith("sb-")) {
      cookieStore.delete(cookie.name);
    }
  });

  redirect("/login");
}