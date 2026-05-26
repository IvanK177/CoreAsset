import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth callback handler for Google OAuth and email confirmation.
 * Exchanges the code from the URL query params for a Supabase session,
 * then redirects the user based on their role from the employees table.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth error from provider
  if (errorParam) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", errorParam);
    if (errorDescription) loginUrl.searchParams.set("error_description", errorDescription);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  // Create a preliminary response so that exchangeCodeForSession
  // can set auth cookies via the setAll callback
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set on request so downstream logic sees fresh tokens
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Set on response so the browser receives updated cookies
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Exchange the OAuth code for a Supabase session
  const {
    data: { user },
    error: exchangeError,
  } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !user) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "auth_callback_error");
    loginUrl.searchParams.set(
      "error_description",
      exchangeError?.message ?? "Failed to authenticate"
    );
    return NextResponse.redirect(loginUrl);
  }

  // Determine role from employees table (primary) with JWT metadata fallback
  let role = "employee";
  const { data: employee } = await supabase
    .from("employees")
    .select("role")
    .eq("id", user.id)
    .single();

  if (employee?.role) {
    role = employee.role;
  } else {
    // Fallback to JWT metadata if DB query fails
    role = user.app_metadata?.role ?? user.user_metadata?.role ?? "employee";
  }

  const redirectPath =
    role === "admin" ? "/dashboard" : role === "it_specialist" ? "/it-portal" : "/portal";

  // Build final redirect response, preserving all auth cookies
  // that were set by exchangeCodeForSession via setAll
  const finalResponse = NextResponse.redirect(new URL(redirectPath, origin));
  response.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value);
  });

  return finalResponse;
}