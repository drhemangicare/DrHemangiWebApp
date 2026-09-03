import crypto from "crypto";
import { requireEnv } from "@/lib/env";

/**
 * OTPs are stored as a keyed hash rather than plaintext. The table sits next
 * to the patient list, so a read-only leak previously handed over live login
 * codes for every address that had requested one.
 *
 * Salted with the email so identical codes for different people don't collide
 * to the same digest.
 */
export function hashOtp(email: string, otp: string): string {
  return crypto
    .createHmac("sha256", requireEnv("lookupTokenSecret"))
    .update(`${email.toLowerCase()}:${otp}`)
    .digest("hex");
}

/** Constant-time compare that tolerates length mismatch. */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  try {
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}
