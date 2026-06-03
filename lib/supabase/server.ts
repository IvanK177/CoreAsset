import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import dns from "dns";

// Local development network overrides inside the Next.js server worker
if (process.env.NODE_ENV === "development") {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (e) {
    console.warn("Failed to set DNS servers:", e);
  }
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  // Override dns.lookup globally to force using our overridden DNS servers for Supabase domains
  const originalLookup = dns.lookup;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dns.lookup = function (hostname: string, options: any, callback: any) {
    const cb = typeof options === "function" ? options : callback;
    const opts = typeof options === "object" ? options : {};

    if (hostname.endsWith("supabase.co") || hostname.endsWith("supabase.com")) {
      dns.resolve4(hostname, (err, addresses) => {
        if (err || !addresses || addresses.length === 0) {
          return originalLookup(hostname, opts, cb);
        }
        const ip = addresses[0];
        if (opts.all) {
          const addrList = addresses.map((addr) => ({ address: addr, family: 4 }));
          return cb(null, addrList);
        }
        return cb(null, ip, 4);
      });
    } else {
      return originalLookup(hostname, opts, cb);
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

/** Regular client — respects RLS policies, uses user's JWT from cookies */
export const createClient = async () => {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
};

/** Service-role client — bypasses RLS entirely, for admin write operations.
 *  Uses the SUPABASE_SERVICE_ROLE_KEY which has full database access.
 *  Should only be used in server actions ("use server") for INSERT/UPDATE/DELETE. */
export const createServiceClient = () => {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
