import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth callback handler for Google OAuth and email confirmation.
 * Exchanges the code from the URL query params for a Supabase session,
 * then redirects the user based on their profile status:
 * - No employee profile → /onboarding
 * - Has profile with role → role-based portal
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
  const response = NextResponse.next({
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

  // Check if user has an employee profile
  const { data: employee } = await supabase
    .from("employees")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  // If no employee profile or no full_name → redirect to onboarding
  if (!employee || !employee.full_name) {
    const finalResponse = NextResponse.redirect(new URL("/onboarding", origin));
    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie.name, cookie.value);
    });
    return finalResponse;
  }

  // Has a complete profile — redirect based on role
  const redirectPath =
    employee.role === "admin"
      ? "/dashboard"
      : employee.role === "it_specialist"
      ? "/it-portal"
      : employee.role === "facilities"
      ? "/facilities-portal"
      : "/portal";

  // Build final redirect response, preserving all auth cookies
  const finalResponse = NextResponse.redirect(new URL(redirectPath, origin));
  response.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value);
  });

  return finalResponse;
}