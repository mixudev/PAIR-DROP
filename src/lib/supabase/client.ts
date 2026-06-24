import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseConfigured, env } from "@/config/env";

export function createClient() {
  assertSupabaseConfigured();
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
