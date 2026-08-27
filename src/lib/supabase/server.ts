import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env, requireEnv } from "@/lib/env";

// Server-only client using the SERVICE ROLE key. This bypasses Row Level
// Security entirely, which is why it must never be imported into any file
// that ships to the browser (only used inside API route handlers / server
// components). All public + admin API routes funnel their DB access through
// this single client instead of relying on per-table RLS policies.
let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = requireEnv("supabaseUrl");
  const key = requireEnv("supabaseServiceRoleKey");
  cached = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}
