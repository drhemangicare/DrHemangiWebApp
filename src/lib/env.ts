import { randomBytes } from "crypto";

// Centralised, typed access to environment variables. Nothing here throws at
// import time (so `next build` doesn't fail before env vars are configured);
// routes that need a given var check it lazily and return a clear error.

function get(name: string): string | undefined {
  return process.env[name];
}

let devSecret: string | undefined;
function devOnlySecret(): string | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  if (!devSecret) devSecret = randomBytes(32).toString("hex");
  return devSecret;
}

export const env = {
  // Supabase
  supabaseUrl: get("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: get("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: get("SUPABASE_SERVICE_ROLE_KEY"),

  // Razorpay
  razorpayKeyId: get("RAZORPAY_KEY_ID"),
  razorpayKeySecret: get("RAZORPAY_KEY_SECRET"),

  // Brevo (transactional email)
  brevoApiKey: get("BREVO_API_KEY"),
  brevoSenderEmail: get("BREVO_SENDER_EMAIL") || "no-reply@example.com",
  brevoSenderName: get("BREVO_SENDER_NAME") || "Dr Hemangi Clinic",
  clinicNotifyEmail: get("CLINIC_NOTIFY_EMAIL"), // doctor's inbox for new-booking alerts

  // Google Calendar / Meet
  googleClientId: get("GOOGLE_CLIENT_ID"),
  googleClientSecret: get("GOOGLE_CLIENT_SECRET"),
  googleRedirectUri: get("GOOGLE_REDIRECT_URI"),

  // App
  appUrl: get("NEXT_PUBLIC_APP_URL") || "http://localhost:3000",
  // No fallback. This key signs the tokens that authorise cancel / reschedule
  // / report-upload on a patient's booking. It previously defaulted to a
  // literal published in this repository, so a single missed env var in
  // production would let anyone forge a valid token for any patient's email.
  // Missing now throws at first use via requireEnv() instead of degrading
  // silently. Outside production a per-process random value keeps `next dev`
  // working without config (tokens simply don't survive a restart).
  lookupTokenSecret: get("LOOKUP_TOKEN_SECRET") || devOnlySecret(),
  timezone: get("CLINIC_TIMEZONE") || "Asia/Kolkata",
};

export function requireEnv<K extends keyof typeof env>(key: K): NonNullable<(typeof env)[K]> {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable for "${key}". See SETUP.md.`);
  }
  return value as NonNullable<(typeof env)[K]>;
}
