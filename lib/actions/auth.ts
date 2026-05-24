"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Shared sign-out action used by Sidebar and PortalHeader.
 * Clears the Supabase session and demo cookies, then redirects to /login.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Clear demo cookies as well
  const cookieStore = await cookies();
  cookieStore.delete("demo_role");
  cookieStore.delete("demo_employee_id");

  redirect("/login");
}