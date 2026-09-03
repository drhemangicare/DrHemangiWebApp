import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generateOtp } from "@/lib/reference";
import { sendOtpEmail } from "@/lib/brevo";
import { jsonError, safeMessage } from "@/lib/http";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { hashOtp } from "@/lib/otp";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const OTP_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 45;

// Starts the "no account" booking-lookup flow: emails a 6-digit code to the
// address the patient booked with. We always respond ok:true (even if the
// email has no bookings) so this endpoint can't be used to test which
// emails have booked with the clinic.
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request body");
  }
  const email = String(body?.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return jsonError("Please provide a valid email address");

  // The 45s per-email cooldown below was the ONLY throttle. With no per-IP or
  // global cap, 300 requests to distinct addresses exhausted the clinic's
  // daily transactional-email quota, so real patients stopped receiving
  // booking confirmations — and it made the clinic a free relay for
  // clinic-branded mail to arbitrary third parties.
  const ip = clientIp(req);
  const perIp = await rateLimit("otp_send_ip", ip, 10, 3600);
  if (!perIp.ok) {
    return jsonError("Too many code requests from this network — please try again later", 429);
  }
  const perEmail = await rateLimit("otp_send_email", email, 5, 3600);
  if (!perEmail.ok) {
    return jsonError("Too many codes requested for this email — please try again later", 429);
  }

  try {
    const sb = supabaseAdmin();

    const { data: recent } = await sb
      .from("booking_otps")
      .select("created_at")
      .eq("email", email)
      .eq("purpose", "lookup")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recent && Date.now() - new Date(recent.created_at).getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
      return jsonError("Please wait a few seconds before requesting another code", 429);
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();
    // Stored as a salted hash, not plaintext. These rows sit next to the
    // patient list; a read-only leak of this table previously handed over
    // live login codes for every address that had requested one.
    await sb.from("booking_otps").insert({
      reference_code: "*", // this OTP is scoped to the email, not one specific booking
      email,
      otp_code: hashOtp(email, otp),
      purpose: "lookup",
      expires_at: expiresAt,
    });
    // Opportunistic cleanup — nothing else ever deleted these rows.
    sb.rpc("purge_expired_otps").then(() => {}, () => {});

    await sendOtpEmail(email, otp);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("otp send failed", err);
    // Deliberately generic: safeMessage() forwarded raw Postgres/Brevo error
    // text (column names, constraint names, API responses) to unauthenticated
    // callers.
    void safeMessage;
    return jsonError("Could not send verification code", 500);
  }
}
