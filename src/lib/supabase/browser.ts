import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicEnv } from "@/lib/env";

let browserClient: SupabaseClient | null = null;

export function createBrowserSupabase() {
  const env = getSupabasePublicEnv();
  if (!env) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(env.url, env.anonKey);
  }
  return browserClient;
}
