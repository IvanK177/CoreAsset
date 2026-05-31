import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Admin-only routes that employees should not access */
const ADMIN_ROUTES = [
  "/dashboard",
  "/computers",
  "/employees",
  "/licenses",
  "/incidents",
  "/finances",
  "/templates",
];

/** Public routes that don't require authentication */
const PUBLIC_ROUTES = ["/login", "/register", "/auth/callback"];

/** Role-based home paths */
const ROLE_HOME: Record<string, string> = {
  admin: "/dashboard",
  it_specialist: "/it-portal",
  employee: "/portal",
  facilities: "/facilities-portal",
};

function getRoleHome(role: string): string {
  return ROLE_HOME[role] ?? "/portal";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Create a base response to attach Supabase session cookies to
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Create Supabase client using @supabase/ssr for session refresh
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          // Update request cookies so downstream handlers see fresh values
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // Recreate response with updated request headers so cookies propagate
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          // Set response cookies (session refresh tokens, etc.)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. Refresh session — MUST be called before any auth logic
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Determine role & profile status
  const demoRole = request.cookies.get("demo_role")?.value;
  let role: string | null = null;
  let hasProfile = false;

  if (demoRole) {
    // Demo mode: bypasses DB checks and onboarding
    role = demoRole;
    hasProfile = true;
  } else if (user) {
    // Real auth: query role & full_name from employees table
    const { data: employee } = await supabase
      .from("employees")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (employee) {
      role = employee.role;
      hasProfile = !!employee.full_name;
    } else {
      // Authenticated but no employee record yet
      role = user.app_metadata?.role ?? user.user_metadata?.role ?? "employee";
      hasProfile = false;
    }
  }

  const isAuthenticated = !!role;
  const isPublicRoute = PUBLIC_ROUTES.some((p) => pathname.startsWith(p));
  const isOnboardingRoute = pathname.startsWith("/onboarding");
  const hasPendingReg = request.cookies.has("pending_reg");

  // Helper to make redirects that carry over Supabase refresh cookies
  const redirectWithCookies = (targetPath: string) => {
    const url = request.nextUrl.clone();
    url.pathname = targetPath;
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  };

  // 5. Unauthenticated user trying to access a protected route → redirect to /login
  if (!isAuthenticated) {
    if (isPublicRoute) {
      return supabaseResponse;
    }
    if (isOnboardingRoute && hasPendingReg) {
      return supabaseResponse;
    }
    return redirectWithCookies("/login");
  }

  // 6. Authenticated user but does NOT have a complete profile → redirect to /onboarding (unless accessing login/register)
  if (!hasProfile) {
    if (isOnboardingRoute || pathname.startsWith("/login") || pathname.startsWith("/register")) {
      return supabaseResponse;
    }
    return redirectWithCookies("/onboarding");
  }

  // 7. Authenticated user with a profile on /onboarding, /login, or /register → redirect to role home
  if (isOnboardingRoute || pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return redirectWithCookies(getRoleHome(role!));
  }

  // 8. Root path / → redirect to role home
  if (pathname === "/") {
    return redirectWithCookies(getRoleHome(role!));
  }

  // 9. Role-based route protection
  const isAdminRoute =
    ADMIN_ROUTES.some((r) => pathname.startsWith(r)) || pathname === "/";
  const isEmployeePortal = pathname.startsWith("/portal");
  const isITPortal = pathname.startsWith("/it-portal");
  const isFacilitiesPortal = pathname.startsWith("/facilities-portal");
  const roleHome = getRoleHome(role!);

  if (role === "admin") {
    // Admin: can access dashboard / admin routes; block employee, IT, & facilities portals
    if (isEmployeePortal || isITPortal || isFacilitiesPortal) {
      return redirectWithCookies(roleHome);
    }
  } else if (role === "it_specialist") {
    // IT specialist: can only access /it-portal; block dashboard, employee, & facilities portals
    if (isAdminRoute || isEmployeePortal || isFacilitiesPortal) {
      return redirectWithCookies(roleHome);
    }
  } else if (role === "facilities") {
    // Facilities: can only access /facilities-portal; block dashboard, employee, & IT portals
    if (isAdminRoute || isEmployeePortal || isITPortal) {
      return redirectWithCookies(roleHome);
    }
  } else {
    // Employee (or unknown role): can only access /portal; block dashboard, IT, & facilities portals
    if (isAdminRoute || isITPortal || isFacilitiesPortal) {
      return redirectWithCookies(roleHome);
    }
  }

  // 10. All checks passed — return response with refreshed session cookies
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
