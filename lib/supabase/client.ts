import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

export const createClient = () => {
  const isBrowser = typeof window !== "undefined";
  const supabaseUrl = isBrowser ? `${window.location.origin}/supabase-proxy` : process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const realUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  return createBrowserClient<Database>(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: {
        url: realUrl ? realUrl.replace(/^http/, "ws") + "/realtime/v1" : undefined,
      } as any,
    }
  );
};
