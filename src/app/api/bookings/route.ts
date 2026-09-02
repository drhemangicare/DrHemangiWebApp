import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isSlotAvailable } from "@/lib/availability";
import { applyDiscount, bestDiscountFor, loadLiveDiscounts } from "@/lib/pricing";
import { generateReferenceCode } from "@/lib/reference";
import { razorpayClient } from "@/lib/razorpay";
import { jsonError, safeMessage } from "@/lib/http";
import { requireEnv } from "@/lib/env";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const { category_id, date, time, patient } = body || {};
  if (!category_id || !DATE_RE.test(date) || !TIME_RE.test(time)) {
    return jsonError("category_id, date (YYYY-MM-DD) and time (HH:MM) are required");
  }
  if (!patient || typeof patient !== "object") return jsonError("Patient details are required");
  const name = String(patient.name || "").trim();
  const age = Number(patient.age);
  const phone = String(patient.phone || "").trim();
  const email = String(patient.email || "").trim().toLowerCase();
  const reason = String(patient.reason || "").trim();
  const visitType = String(patient.visit_type || "first");

  if (name.length < 2) return jsonError("Please provide the patient's name");
  if (!Number.isFinite(age) || age < 10 || age > 99) return jsonError("Please provide a valid age");
  if (!PHONE_RE.test(phone)) return jsonError("Please provide a valid 10-digit Indian mobile number");
  if (!EMAIL_RE.test(email)) return jsonError("Please provide a valid email address");
  if (reason.length < 3) return jsonError("Please briefly describe the reason for the visit");

  // Booking dates must be in the future (basic sanity — availability already
  // excludes past/too-soon slots, this just rejects obviously bad input fast).
  const todayStr = new Date().toISOString().slice(0, 10);
  if (date < todayStr) return jsonError("That date is in the past");

  // Each POST reserves the slot for 20 minutes *before* any payment, so an
  // unauthenticated loop could hold the entire 21-day calendar (~300 slots)
  // and re-fire every 20 minutes to keep it locked. It also created a real
  // Razorpay order and persisted attacker-supplied PII on every call.
  const ip = clientIp(req);
  const ipLimit = await rateLimit("booking_create_ip", ip, 8, 3600);
  if (!ipLimit.ok) {
    return jsonError("Too many booking attempts from this network — please try again later", 429);
  }
  const emailLimit = await rateLimit("booking_create_email", email, 5, 3600);
  if (!emailLimit.ok) {
    return jsonError("Too many booking attempts for this email — please try again later", 429);
  }

  try {
    const sb = supabaseAdmin();

    const { data: category, error: catErr } = await sb
      .from("categories")
      .select("*")
      .eq("id", category_id)
      .eq("is_active", true)
      .maybeSingle();
    if (catErr) throw catErr;
    if (!category) return jsonError("That consultation type is no longer available", 404);

    // Categories like "Follow-up Consult" are priced/timed for returning
    // patients only. Don't just trust the "have you consulted before?" chip
    // (that's self-declared and easy to change) — actually check whether
    // this phone or email has a prior *paid* booking with the clinic.
    if (category.existing_patients_only) {
      // NOT `.or("patient_email.eq." + email)`. PostgREST parses that string
      // as filter syntax and postgrest-js interpolates it verbatim, while
      // EMAIL_RE happily allows "," "(" ")" and "*" — so an address like
      //   a@b.co,id.not.is.null
      // rewrote the predicate and turned this into an unauthenticated boolean
      // oracle over every patient's phone and email. Two parameterised
      // equality queries instead; no user text ever reaches the filter DSL.
      const [byPhone, byEmail] = await Promise.all([
        sb.from("bookings").select("id").eq("payment_status", "paid").eq("patient_phone", phone).limit(1).maybeSingle(),
        sb.from("bookings").select("id").eq("payment_status", "paid").eq("patient_email", email).limit(1).maybeSingle(),
      ]);
      if (byPhone.error) throw byPhone.error;
      if (byEmail.error) throw byEmail.error;
      const priorBooking = byPhone.data || byEmail.data;
      if (!priorBooking) {
        // Worded so it cannot be used to enumerate the clinic's patients. The
        // previous message confirmed, to an unauthenticated caller supplying
        // an arbitrary mobile number, whether that person had ever paid for a
        // consultation at a gynaecology/fertility clinic.
        return jsonError(
          `"${category.name}" can only be booked from the link in your previous consultation email. Please choose another consultation type, or contact the clinic.`,
          403
        );
      }
    }

    const available = await isSlotAvailable(category_id, date, time);
    if (!available) return jsonError("That slot was just taken — please choose another time", 409);

    const discounts = await loadLiveDiscounts();
    const discount = bestDiscountFor(discounts, category_id);
    const { finalPrice, discountAmount } = applyDiscount(Number(category.price), discount);

    let referenceCode = generateReferenceCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: clash } = await sb.from("bookings").select("id").eq("reference_code", referenceCode).maybeSingle();
      if (!clash) break;
      referenceCode = generateReferenceCode();
    }

    const { data: booking, error: insertErr } = await sb
      .from("bookings")
      .insert({
        reference_code: referenceCode,
        category_id,
        patient_name: name,
        patient_email: email,
        patient_phone: phone,
        patient_age: age,
        reason,
        scheduled_date: date,
        scheduled_time: time,
        duration_minutes: category.duration_minutes,
        status: "pending_payment",
        price_original: category.price,
        discount_id: discount?.id ?? null,
        discount_amount: discountAmount,
        price_final: finalPrice,
        payment_status: "pending",
      })
      .select("id")
      .single();
    if (insertErr) {
      // 23505 = unique_violation on bookings_one_per_slot. The availability
      // check and this insert are separate statements, so two concurrent
      // requests for the same slot both used to succeed and both took money.
      // The database is now the arbiter; the loser gets told to pick again.
      if ((insertErr as { code?: string }).code === "23505") {
        return jsonError("That slot was just taken — please choose another time", 409);
      }
      throw insertErr;
    }

    // Razorpay requires amount in paise, and a receipt id under 40 chars.
    const amountPaise = Math.round(finalPrice * 100);
    let razorpayOrderId: string | null = null;
    try {
      const order = await razorpayClient().orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: referenceCode,
        notes: { booking_id: booking.id, category: category.name },
      });
      razorpayOrderId = order.id;
    } catch (payErr) {
      // Roll back the reservation so the slot isn't held forever if Razorpay
      // isn't configured yet (e.g. during initial setup/testing).
      await sb.from("bookings").delete().eq("id", booking.id);
      throw new Error(
        `Could not start payment: ${safeMessage(payErr)}. Check RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET in .env — see SETUP.md.`
      );
    }

    await sb.from("bookings").update({ razorpay_order_id: razorpayOrderId }).eq("id", booking.id);

    // visit_type isn't its own column (kept in `reason` context for the doctor);
    // stash it lightly for future use without a schema change.
    if (visitType && visitType !== "first") {
      await sb
        .from("bookings")
        .update({ reason: `[${visitType}] ${reason}` })
        .eq("id", booking.id);
    }

    return NextResponse.json({
      booking_id: booking.id,
      reference_code: referenceCode,
      razorpay_order_id: razorpayOrderId,
      key_id: requireEnv("razorpayKeyId"),
      currency: "INR",
      price_original: Number(category.price),
      discount_amount: discountAmount,
      price_final: finalPrice,
      category_name: category.name,
    });
  } catch (err) {
    console.error("booking create failed", err);
    void safeMessage;
    return jsonError("Could not create booking — please try again, or contact the clinic.", 500);
  }
}
