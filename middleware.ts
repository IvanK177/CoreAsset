import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware handles authentication and onboarding protection:
 *
 * 1. Unauthenticated users → redirect to /login (except auth pages)
 * 2. Authenticated users without an employee profile → redirect to /onboarding
 * 3. Authenticated users with a profile on /onboarding → redirect to their portal
 * 4. Authenticated users with a profile on auth pages → redirect to their portal
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets, API signout, and auth callback
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/signout") ||
    pathname === "/auth/callback"
  ) {
    return NextResponse.next();
  }

  // Create Supabase client for middleware (Edge Runtime compatible)
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

  // Get the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route categories
  const authRoutes = ["/login", "/register"];
  const onboardingRoute = "/onboarding";

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isOnboardingRoute = pathname.startsWith(onboardingRoute);

  // ── Unauthenticated user ──────────────────────────────────────
  if (!user) {
    // Allow access to auth routes (login, register)
    if (isAuthRoute) {
      return response;
    }

    // Redirect to login for any other route (onboarding, portal, dashboard, etc.)
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // ── Authenticated user — check employee profile ───────────────
  const { data: employee } = await supabase
    .from("employees")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  const hasProfile = !!employee && !!employee.full_name;

  // Helper: get redirect path based on role
  function getPortalPath(role: string): string {
    if (role === "admin") return "/dashboard";
    if (role === "it_specialist") return "/it-portal";
    return "/portal";
  }

  // ── On onboarding page ────────────────────────────────────────
  if (isOnboardingRoute) {
    if (hasProfile) {
      // Already has a complete profile — redirect to portal
      const redirectUrl = new URL(
        getPortalPath(employee!.role),
        request.url
      );
      return NextResponse.redirect(redirectUrl);
    }
    // No profile yet — allow access to onboarding
    return response;
  }

  // ── On auth pages (login/register) while authenticated ────────
  if (isAuthRoute) {
    if (hasProfile) {
      // Has profile — redirect to their portal
      const redirectUrl = new URL(
        getPortalPath(employee!.role),
        request.url
      );
      return NextResponse.redirect(redirectUrl);
    }
    // Authenticated but no profile — redirect to onboarding
    const redirectUrl = new URL("/onboarding", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // ── On any other page (portal, dashboard, etc.) ───────────────
  if (!hasProfile) {
    // No profile — must complete onboarding first
    const redirectUrl = new URL("/onboarding", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Has profile — allow access
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};