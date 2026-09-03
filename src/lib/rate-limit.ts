import { supabaseAdmin } from "@/lib/supabase/server";
import crypto from "crypto";

/**
 * Database-backed fixed-window rate limiting.
 *
 * There was previously no rate limiting anywhere: /api/bookings could be
 * hammered to hold every slot on the calendar (each POST reserves one for 20
 * minutes before payment), /api/bookings/lookup could burn the clinic's whole
 * daily transactional-email quota so real patients stopped getting
 * confirmations, and /api/bookings/lookup/verify allowed unlimited OTP
 * guesses.
 *
 * Deliberately in Postgres rather than in-process: serverless instances don't
 * share memory, so an in-memory counter is close to no limit at all.
 */
export type LimitResult = { ok: boolean; retryAfterSeconds: number };

export async function rateLimit(
  bucket: string,
  key: string,
  max: number,
  windowSeconds: number
): Promise<LimitResult> {
  try {
    const sb = supabaseAdmin();
    const windowStart = new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000);
    // Hash the key: it is usually an email address or IP, and this table
    // should not become another copy of the patient list.
    const hashed = crypto.createHash("sha256").update(`${bucket}:${key}`).digest("hex");

    const { data, error } = await sb
      .from("rate_limits")
      .select("count")
      .eq("key_hash", hashed)
      .eq("window_start", windowStart.toISOString())
      .maybeSingle();
    if (error) throw error;

    const used = data?.count ?? 0;
    if (used >= max) {
      const resetAt = windowStart.getTime() + windowSeconds * 1000;
      return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)) };
    }

    await sb.rpc("bump_rate_limit", {
      p_key_hash: hashed,
      p_window_start: windowStart.toISOString(),
      p_bucket: bucket,
    });
    return { ok: true, retryAfterSeconds: 0 };
  } catch {
    // Fail OPEN on infrastructure failure: a broken limiter table should not
    // take the booking flow down. The abuse ceiling is still bounded by the
    // per-email cooldowns and the payment step.
    return { ok: true, retryAfterSeconds: 0 };
  }
}

/** Best-effort client IP behind Vercel / a reverse proxy. */
export function clientIp(req: Request): string {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") || h.get("cf-connecting-ip") || "unknown";
}
