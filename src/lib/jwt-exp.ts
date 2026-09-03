/**
 * How long an access token has left, read locally with no network call.
 *
 * This is NOT authentication. It never decides whether a token is valid, who
 * it belongs to, or whether the signature is genuine — `getAdminUser()` still
 * calls `supabase.auth.getUser()` for that, and that remains the only thing
 * trusted to say "this person is an admin".
 *
 * Its one job is letting the proxy skip a Supabase round trip it does not
 * need. A tampered token claiming a distant expiry buys an attacker nothing:
 * the proxy would decline to refresh it, and the real verification downstream
 * would reject it. The worst case is a session that fails to refresh, which
 * logs the user out — a safe direction to fail in.
 */
export function secondsUntilExpiry(accessToken: string | undefined | null): number | null {
  if (!accessToken) return null;
  const parts = accessToken.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(Buffer.from(payload, "base64").toString("utf8")) as { exp?: number };
    if (typeof json.exp !== "number") return null;
    return json.exp - Math.floor(Date.now() / 1000);
  } catch {
    return null;
  }
}

/** Pull the access token out of whatever shape the Supabase auth cookie is in. */
export function accessTokenFromCookies(all: { name: string; value: string }[]): string | null {
  /* @supabase/ssr writes `sb-<ref>-auth-token`, sometimes split into `.0` and
     `.1` chunks when the session is too big for one cookie, and in newer
     versions base64-prefixed. Reassemble in name order before parsing. */
  const parts = all
    .filter((c) => /^sb-.*-auth-token(\.\d+)?$/.test(c.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => c.value);
  if (!parts.length) return null;

  let raw = parts.join("");
  if (raw.startsWith("base64-")) {
    try {
      raw = Buffer.from(raw.slice("base64-".length), "base64").toString("utf8");
    } catch {
      return null;
    }
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return typeof parsed[0] === "string" ? parsed[0] : null;
    return typeof parsed?.access_token === "string" ? parsed.access_token : null;
  } catch {
    return null;
  }
}
