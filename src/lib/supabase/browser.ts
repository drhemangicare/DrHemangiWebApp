"use client";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Client-side Supabase instance, used only by the admin login form.
 *
 * Everything else the admin UI does goes through our own /api/admin/* routes
 * with the service role key on the server — this client's only job is
 * establishing the auth session cookie those routes then read.
 *
 * ── WHY THE KEYS ARE CHECKED INSTEAD OF ASSERTED ──────────────────────────
 * This used to read `process.env.NEXT_PUBLIC_SUPABASE_URL!`. The `!` is a
 * compile-time assertion that does nothing at runtime, so when the variables
 * were absent it handed `undefined` straight to `createBrowserClient`, which
 * threw *inside the click handler*:
 *
 *   "@supabase/ssr: Your project's URL and API key are required..."
 *
 * A missing `.env.local` is the most likely state for a fresh clone, and the
 * reader deserves to be told that rather than shown a stack trace pointing
 * into a library. `isSupabaseBrowserConfigured()` lets the login page check
 * first and explain; `supabaseBrowser()` still throws if called anyway, but
 * with a message naming the file and the variables.
 *
 * The values are read at module scope on purpose. `NEXT_PUBLIC_*` is inlined
 * at build time by static analysis of `process.env.X`, so it must be a plain
 * property access — a dynamic lookup like `process.env[name]` is NOT replaced
 * in client code and would always be undefined here.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseBrowserConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/** Which variables are missing, so the message can be specific. */
export function missingSupabaseBrowserEnv(): string[] {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return missing;
}

export function supabaseBrowser() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      `Supabase is not configured in the browser. Missing ${missingSupabaseBrowserEnv().join(" and ")}. ` +
        `Add them to .env.local (copy .env.example) and restart the dev server — NEXT_PUBLIC_* values are ` +
        `baked in at build time, so editing the file alone is not enough.`,
    );
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
