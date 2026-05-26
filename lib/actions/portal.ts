"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/** Create an incident from the employee portal (non-redirecting) */
export async function createPortalIncident(formData: FormData) {
  const supabase = await createServiceClient();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const computerId = formData.get("computer_id") as string | null;
  const employeeId = formData.get("employee_id") as string;
  const priority = formData.get("priority") as string;

  const insertData = {
    title: title || null,
    description: description || title,
    computer_id: computerId || null,
    employee_id: employeeId,
    incident_type: "other" as const,
    priority: priority as "low" | "medium" | "high" | "critical",
    status: "open" as const,
  };

  const { data, error } = await supabase
    .from("incidents")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    console.error("[createPortalIncident] Supabase insert error:", error.code, error.message);
    return { error: error.message, code: error.code };
  }

  revalidatePath("/portal");
  revalidatePath("/incidents");
  revalidatePath("/dashboard");
  revalidatePath("/it-portal");
  revalidatePath("/it-portal/my-tasks");
  return { success: true, id: data.id };
}

/** Sign out from portal — clears all auth cookies, demo cookies, and Supabase session */
export async function portalSignOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const { cookies } = await import("next/headers");
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

  const { redirect } = await import("next/navigation");
  redirect("/login");
}