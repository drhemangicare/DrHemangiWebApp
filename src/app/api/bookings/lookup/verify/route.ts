import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { issueLookupToken, verifyLookupToken } from "@/lib/tokens";
import { jsonError, safeMessage } from "@/lib/http";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { hashOtp, timingSafeEqualStr } from "@/lib/otp";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_OTP_ATTEMPTS = 6;

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request body");
  }
  const email = String(body?.email || "").trim().toLowerCase();
  const otp = body?.otp ? String(body.otp).trim() : null;
  const existingToken = body?.token ? String(body.token) : null;
  if (!EMAIL_RE.test(email)) return jsonError("Please provide a valid email address");
  if (!otp && !existingToken) return jsonError("Provide either an otp or a token");

  // MAX_OTP_ATTEMPTS is stored per OTP row and verify always reads the newest
  // row, so requesting a fresh code every 45s reset the counter — an
  // unlimited guessing budget against a 10^6 space. Cap the endpoint itself.
  const ip = clientIp(req);
  const guessLimit = await rateLimit("otp_verify_ip", ip, 20, 900);
  if (!guessLimit.ok) {
    return jsonError("Too many attempts — please wait a few minutes and request a new code", 429);
  }

  try {
    const sb = supabaseAdmin();
    let token = existingToken;

    if (!token || !verifyLookupToken(token, email)) {
      if (!otp) return jsonError("Your session expired — please request a new code", 401);

      const { data: record } = await sb
        .from("booking_otps")
        .select("*")
        .eq("email", email)
        .eq("purpose", "lookup")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!record) return jsonError("No code was requested for this email", 400);
      if (new Date(record.expires_at) < new Date()) return jsonError("That code has expired — please request a new one", 400);
      if (record.attempts >= MAX_OTP_ATTEMPTS) return jsonError("Too many attempts — please request a new code", 429);
      // `verified` was written but never read, so a code stayed usable for its
      // full 10-minute TTL even after a successful login — anyone who saw it
      // once (shared inbox, forwarded mail, shoulder surf) could reuse it.
      if (record.consumed_at) return jsonError("That code has already been used — please request a new one", 400);

      if (!timingSafeEqualStr(record.otp_code, hashOtp(email, otp))) {
        await sb.from("booking_otps").update({ attempts: record.attempts + 1 }).eq("id", record.id);
        return jsonError("Incorrect code", 400);
      }

      await sb
        .from("booking_otps")
        .update({ verified: true, consumed_at: new Date().toISOString() })
        .eq("id", record.id);
      token = issueLookupToken(email);
    }

    const { data: bookings, error } = await sb
      .from("bookings")
      .select("*, categories(name), booking_documents(id, file_name, file_type, created_at)")
      .eq("patient_email", email)
      .neq("status", "pending_payment") // hide abandoned/unpaid attempts
      .order("scheduled_date", { ascending: false });
    if (error) throw error;

    const out = (bookings || []).map((b: any) => ({
      id: b.id,
      reference_code: b.reference_code,
      category_id: b.category_id,
      category_name: b.categories?.name || "Consultation",
      scheduled_date: b.scheduled_date,
      scheduled_time: b.scheduled_time,
      duration_minutes: b.duration_minutes,
      status: b.status,
      payment_status: b.payment_status,
      price_final: b.price_final,
      meet_link: b.meet_link,
      doctor_notes: b.doctor_notes,
      documents: (b.booking_documents || []).map((d: any) => ({ id: d.id, file_name: d.file_name, file_type: d.file_type })),
    }));

    return NextResponse.json({ token, bookings: out });
  } catch (err) {
    console.error("otp verify failed", err);
    void safeMessage;
    return jsonError("Could not verify", 500);
  }
}
