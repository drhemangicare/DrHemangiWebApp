import { createHash } from "crypto";
import { secondsUntilExpiry } from "@/lib/jwt-exp";

/**
 * The verified admin, remembered per access token.
 *
 * ── WHY, AND WHAT IT COSTS ────────────────────────────────────────────────
 * `supabase.auth.getUser()` is a network round trip to the Auth server, and
 * the admin panel pays it more than once per click:
 *
 *   1. the (protected) layout calls getAdminUser() before it can render — so
 *      even `loading.tsx` cannot appear until that request comes back;
 *   2. the page mounts and fetches /api/admin/…, and that route calls
 *      requireAdmin(), which calls getAdminUser() all over again;
 *   3. only then does the query the click was actually about begin.
 *
 * React's `cache()` dedupes within ONE request, so it cannot help across those
 * two. Against a Supabase project answering in ~1s — this one has been
 * measured at ~3.5s cold — that is a second or two of nothing happening after
 * every click, before any useful work starts.
 *
 * ── WHY THIS IS NOT A HOLE ────────────────────────────────────────────────
 * The cache key is the access token itself, so a different or absent token
 * never hits it and a signed-out browser has nothing to present. Before any
 * hit is served the token's own `exp` is checked locally, so an expired token
 * is re-verified however fresh the entry is — expiry, not the TTL, is the real
 * bound.
 *
 * What the TTL bounds is revocation: a session revoked server-side stays
 * usable for up to 30 seconds on an instance that has already seen it. That is
 * the identical trade already made, deliberately, for the staff lookup in
 * admin-session.ts, and 30s is short against the token's own hour.
 *
 * The token is hashed rather than stored, so a heap dump or an accidental log
 * of this map does not hand anyone a live bearer credential.
 *
 * It lives in its own module rather than inside admin-session.ts so it can be
 * tested without pulling in `next/headers`.
 */
export type AdminUser = { id: string; email: string | undefined; fullName: string; role: string };

export const AUTH_TTL_MS = 30_000;
/* A token that failed verification is barely cached at all: the fix for that
   state is usually signing in again, and it should take effect at once. */
export const AUTH_MISS_TTL_MS = 2_000;
/* One deployment serves one clinic, so this holds a handful of entries. The
   bound is a safety valve, not a strategy. */
export const AUTH_CACHE_MAX = 200;

type Entry = { user: AdminUser | null; at: number };
const authCache = new Map<string, Entry>();

function tokenKey(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * The remembered answer for this token, or `undefined` for "ask the server".
 *
 * `undefined` and `null` mean different things here: `null` is a remembered
 * "this token is not an admin", `undefined` is "no usable memory".
 */
export function readCachedAdmin(
  token: string | null,
  now: number = Date.now(),
): AdminUser | null | undefined {
  if (!token) return undefined;
  /* Local base64 decode of the token's own payload — no network. Every failure
     path in it returns null, which falls through to a real verification. */
  const ttl = secondsUntilExpiry(token);
  if (ttl === null || ttl <= 0) return undefined;

  const hit = authCache.get(tokenKey(token));
  if (!hit) return undefined;
  const window = hit.user ? AUTH_TTL_MS : AUTH_MISS_TTL_MS;
  if (now - hit.at >= window) return undefined;
  return hit.user;
}

export function rememberAdmin(
  token: string | null,
  user: AdminUser | null,
  now: number = Date.now(),
) {
  if (!token) return;
  if (authCache.size >= AUTH_CACHE_MAX) authCache.clear();
  authCache.set(tokenKey(token), { user, at: now });
}

/** Drop one token's memory, or all of them. Used on sign-out and by tests. */
export function forgetAdminAuth(token?: string) {
  if (token) authCache.delete(tokenKey(token));
  else authCache.clear();
}

/** Test/diagnostic only. */
export function adminAuthCacheSize(): number {
  return authCache.size;
}
