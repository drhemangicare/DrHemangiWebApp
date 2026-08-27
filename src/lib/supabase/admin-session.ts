import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env, requireEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * The `staff` row, remembered briefly per user.
 *
 * Loading an admin screen cost five sequential Supabase round trips: the
 * layout verified the session (auth call + staff lookup), then the page
 * fetched its data from an API route which verified all over again, and only
 * then ran the query it was actually called for. Two of those five were the
 * same staff lookup for the same person, answering the same way it has since
 * the row was created.
 *
 * The auth check itself is deliberately NOT cached — that is the security
 * boundary and stays a real verification every request. This only remembers
 * "is this already-verified user on the staff list", which changes about once
 * in the lifetime of the clinic. Thirty seconds bounds how long a removed
 * staff member could linger.
 *
 * Module-level, so it lives as long as the serverless instance and starts cold
 * on a new one.
 */
type StaffRow = { id: string; full_name: string; role: string };
const STAFF_TTL_MS = 30_000;
/* A signed-in user with NO staff row is the common misconfiguration, so it is
   cached for only a moment — the fix is to insert the row, and that should
   take effect on the next reload rather than after a wait. */
const STAFF_MISS_TTL_MS = 2_000;
const staffCache = new Map<string, { row: StaffRow | null; at: number }>();

async function lookupStaff(userId: string): Promise<StaffRow | null> {
  const hit = staffCache.get(userId);
  if (hit) {
    const ttl = hit.row ? STAFF_TTL_MS : STAFF_MISS_TTL_MS;
    if (Date.now() - hit.at < ttl) return hit.row;
  }
  const { data } = await supabaseAdmin()
    .from("staff")
    .select("id, full_name, role")
    .eq("id", userId)
    .maybeSingle();
  const row = (data as StaffRow | null) ?? null;
  staffCache.set(userId, { row, at: Date.now() });
  return row;
}

// Reads the doctor's logged-in session from cookies (set by the Supabase
// Auth helper on the /admin/login page) and confirms the user is listed in
// the `staff` table before treating them as an admin. Used by every
// /api/admin/* route and by /admin/* server components.
/* `cache()` dedupes within a single request: the admin layout and any server
   component beneath it ask for the same answer, and used to each pay for it. */
export const getAdminUser = cache(async function getAdminUser() {
  if (!env.supabaseUrl || !env.supabaseAnonKey || !env.supabaseServiceRoleKey) {
    // Not configured yet (fresh clone before .env.local is filled in) —
    // treat as "not signed in" rather than crashing the whole page with a 500.
    return null;
  }
  const cookieStore = await cookies();
  const url = requireEnv("supabaseUrl");
  const anonKey = requireEnv("supabaseAnonKey");

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Server Components cannot write cookies, so refreshed tokens are
        // persisted by src/middleware.ts instead — without it the session
        // silently dies when the access token expires and every admin page
        // bounces to /admin/login.
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Both branches below used to `return null` silently, so a correct password
  // bounced straight back to /admin/login with no clue which check failed.
  // Admin access needs TWO things: a Supabase Auth user AND a matching row in
  // `staff` — creating the user in the Auth dashboard alone is not enough.
  if (!user) {
    console.warn("[admin] no valid Supabase session cookie");
    return null;
  }

  const staff = await lookupStaff(user.id);

  if (!staff) {
    console.warn(
      `[admin] signed in as ${user.email} (${user.id}) but no matching row in "staff" — ` +
        `insert one with that exact id. See SETUP.md.`
    );
    return null;
  }
  return { id: user.id, email: user.email, fullName: staff.full_name, role: staff.role };
});

export function supabaseBrowserEnv() {
  return { url: env.supabaseUrl, anonKey: env.supabaseAnonKey };
}
