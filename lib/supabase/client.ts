import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

export const createClient = () => {
  const isBrowser = typeof window !== "undefined";
  const supabaseUrl = isBrowser ? `${window.location.origin}/supabase-proxy` : process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const realUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  // Extract project reference from NEXT_PUBLIC_SUPABASE_URL to make sure browser cookie name aligns with server
  const projectRef = realUrl ? new URL(realUrl).hostname.split(".")[0] : "";
  const cookieName = projectRef ? `sb-${projectRef}-auth-token` : undefined;
  
  return createBrowserClient<Database>(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: cookieName,
      },
      realtime: {
        url: realUrl ? realUrl.replace(/^http/, "ws") + "/realtime/v1" : undefined,
      } as any,
    }
  );
};
