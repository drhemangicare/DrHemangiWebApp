import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { confirmBookingPayment } from "@/lib/confirm-booking";

// Fallback safety net: if a patient's browser closes right after paying
// (before our client-side /api/payments/verify call finishes), Razorpay
// still calls this webhook, so the booking gets confirmed and the email
// still goes out. Configure this URL + a webhook secret in the Razorpay
// dashboard (see SETUP.md) — entirely optional but recommended.
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  // FAIL CLOSED. This previously only verified the signature `if (secret)`,
  // so a deployment without RAZORPAY_WEBHOOK_SECRET accepted *any* unsigned
  // POST — and /api/bookings hands the razorpay_order_id straight to the
  // browser, so an attacker could confirm their own booking as paid (and
  // trigger the confirmation email + Meet link) without paying a rupee.
  // An unconfigured secret now disables the endpoint instead of opening it.
  if (!secret) {
    console.error("Razorpay webhook hit but RAZORPAY_WEBHOOK_SECRET is not set — rejecting.");
    return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
  }
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const event = payload?.event;
  if (event !== "payment.captured" && event !== "order.paid") {
    return NextResponse.json({ ok: true }); // ignore events we don't act on
  }

  try {
    const payment = payload?.payload?.payment?.entity;
    const orderId = payment?.order_id;
    const paymentId = payment?.id;
    if (!orderId || !paymentId) return NextResponse.json({ ok: true });

    const sb = supabaseAdmin();
    const { data: booking } = await sb.from("bookings").select("id, payment_status").eq("razorpay_order_id", orderId).maybeSingle();
    if (!booking || booking.payment_status === "paid") return NextResponse.json({ ok: true });

    await confirmBookingPayment(booking.id, paymentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook confirm failed:", err);
    // Return 200 anyway — Razorpay retries on non-2xx, and the client-side
    // verify call is the primary path; this is best-effort.
    return NextResponse.json({ ok: true });
  }
}
