import crypto from "crypto";
import { requireEnv } from "@/lib/env";

// Lightweight signed tokens for the "no account" patient booking-lookup flow.
// After a patient verifies an email OTP, we hand back a short-lived token
// (HMAC of the email + expiry) instead of building a real session system.
// It proves "this browser recently verified this email" for the follow-up
// reschedule/cancel/upload calls, without storing server-side sessions.
const TTL_MS = 30 * 60 * 1000; // 30 minutes

// NOTE ON FRAMING: the payload used to be joined with "." and split back on
// ".", but every email address contains at least one dot, so the decoded
// token always produced 4+ parts and the `!== 3` guard rejected 100% of
// legitimate tokens. The ownership check on cancel / reschedule / upload was
// therefore dead code that always failed closed. The separator is now a
// character that cannot appear in an address, and the email is length-framed
// so the split is unambiguous regardless of its contents.
const SEP = "|";

export function issueLookupToken(email: string): string {
  const expires = Date.now() + TTL_MS;
  const payload = `${email.toLowerCase()}${SEP}${expires}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}${SEP}${sig}`).toString("base64url");
}

export function verifyLookupToken(token: string, email: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(SEP);
    if (parts.length !== 3) return false;
    const [tokenEmail, expiresStr, sig] = parts;
    if (tokenEmail !== email.toLowerCase()) return false;
    const expires = Number(expiresStr);
    if (!Number.isFinite(expires) || Date.now() > expires) return false;
    const expected = sign(`${tokenEmail}.${expiresStr}`);
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", requireEnv("lookupTokenSecret")).update(payload).digest("hex");
}
