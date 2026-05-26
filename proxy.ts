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
];

/** Public routes that don't require authentication */
const PUBLIC_ROUTES = ["/login", "/auth/callback"];

export async function proxy(request: NextRequest) {
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

  // 4. Determine authentication status (Supabase auth or demo cookie fallback)
  const demoRole = request.cookies.get("demo_role")?.value;
  const isAuthenticated = !!user || !!demoRole;
  const role =
    user?.app_metadata?.role ?? user?.user_metadata?.role ?? demoRole ?? null;

  const { pathname } = request.nextUrl;

  // 5. Check if this is a public route
  const isPublicRoute = PUBLIC_ROUTES.some((p) => pathname.startsWith(p));

  // 6. Unauthenticated user trying to access a protected route → redirect to /login
  if (!isAuthenticated && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);
    // Carry over any session cookies that Supabase set during refresh attempt
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // 7. Authenticated user on /login → redirect based on role
  if (isAuthenticated && pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = role === "admin" ? "/dashboard" : role === "it_specialist" ? "/it-portal" : "/portal";
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // 8. Role-based route protection
  if (isAuthenticated) {
    const isAdminRoute =
      ADMIN_ROUTES.some((r) => pathname.startsWith(r)) || pathname === "/";
    const isEmployeePortal = pathname.startsWith("/portal");
    const isITPortal = pathname.startsWith("/it-portal");

    if (role === "admin") {
      // Admin: can access dashboard; block employee & IT portals
      if (isEmployeePortal || isITPortal) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        const redirectResponse = NextResponse.redirect(url);
        supabaseResponse.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value);
        });
        return redirectResponse;
      }
    } else if (role === "it_specialist") {
      // IT specialist: can only access /it-portal; block dashboard & employee portal
      if (isAdminRoute || isEmployeePortal) {
        const url = request.nextUrl.clone();
        url.pathname = "/it-portal";
        const redirectResponse = NextResponse.redirect(url);
        supabaseResponse.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value);
        });
        return redirectResponse;
      }
    } else {
      // Employee (or unknown role): can only access /portal; block dashboard & IT portal
      if (isAdminRoute || isITPortal) {
        const url = request.nextUrl.clone();
        url.pathname = "/portal";
        const redirectResponse = NextResponse.redirect(url);
        supabaseResponse.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value);
        });
        return redirectResponse;
      }
    }
  }

  // 9. All checks passed — return response with refreshed session cookies
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
