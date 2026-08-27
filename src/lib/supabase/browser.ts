"use client";
import { createBrowserClient } from "@supabase/ssr";

// Client-side Supabase instance, used only for the admin login form
// (email+password sign-in via Supabase Auth). Everything else the admin UI
// does goes through our own /api/admin/* routes with the service role key
// on the server — this client's only job is establishing the auth session
// cookie that those routes then read.
export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createBrowserClient(url, anonKey);
}
