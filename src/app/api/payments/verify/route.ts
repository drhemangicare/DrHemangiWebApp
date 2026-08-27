import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { confirmBookingPayment } from "@/lib/confirm-booking";
import { jsonError, safeMessage } from "@/lib/http";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request body");
  }
  const { booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body || {};
  if (!booking_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return jsonError("Missing payment details");
  }

  try {
    const sb = supabaseAdmin();
    const { data: booking, error } = await sb.from("bookings").select("razorpay_order_id, payment_status").eq("id", booking_id).maybeSingle();
    if (error) throw error;
    if (!booking) return jsonError("Booking not found", 404);
    if (booking.razorpay_order_id !== razorpay_order_id) return jsonError("Order mismatch", 400);

    if (booking.payment_status !== "paid") {
      const valid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (!valid) return jsonError("Payment signature could not be verified", 400);
    }

    const updated = await confirmBookingPayment(booking_id, razorpay_payment_id);
    return NextResponse.json({
      reference_code: updated.reference_code,
      scheduled_date: updated.scheduled_date,
      scheduled_time: updated.scheduled_time,
      price_final: updated.price_final,
      meet_link: updated.meet_link,
    });
  } catch (err) {
    return jsonError(safeMessage(err, "Payment verification failed"), 500);
  }
}
