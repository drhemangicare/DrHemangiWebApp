import { supabaseAdmin } from "@/lib/supabase/server";
import { createConsultEvent } from "@/lib/google-calendar";
import { sendBookingConfirmationEmail, sendClinicNewBookingAlert } from "@/lib/brevo";
import { env } from "@/lib/env";

/** Shared by /api/payments/verify (client-side confirm) and
 *  /api/payments/webhook (server-side fallback if the browser closes before
 *  the client-side verify call completes). Idempotent — safe to call twice
 *  for the same booking. */
export async function confirmBookingPayment(bookingId: string, paymentId: string) {
  const sb = supabaseAdmin();
  const { data: booking, error } = await sb
    .from("bookings")
    .select("*, categories(name, duration_minutes)")
    .eq("id", bookingId)
    .maybeSingle();
  if (error) throw error;
  if (!booking) throw new Error("Booking not found");
  if (booking.payment_status === "paid") return booking; // already confirmed

  const startIso = toIso(booking.scheduled_date, booking.scheduled_time, env.timezone);
  const endIso = toIso(booking.scheduled_date, booking.scheduled_time, env.timezone, booking.duration_minutes);
  const categoryName = booking.categories?.name || "Consultation";

  const event = await createConsultEvent({
    patientName: booking.patient_name,
    patientEmail: booking.patient_email,
    categoryName,
    startIso,
    endIso,
    referenceCode: booking.reference_code,
    notes: booking.reason,
  });

  const { data: updated, error: updateErr } = await sb
    .from("bookings")
    .update({
      status: "confirmed",
      payment_status: "paid",
      razorpay_payment_id: paymentId,
      meet_link: event?.meetLink ?? null,
      calendar_event_id: event?.eventId ?? null,
    })
    .eq("id", bookingId)
    .select()
    .single();
  if (updateErr) throw updateErr;

  if (booking.discount_id) {
    const { data: discount } = await sb.from("discounts").select("used_count").eq("id", booking.discount_id).maybeSingle();
    if (discount) {
      await sb.from("discounts").update({ used_count: discount.used_count + 1 }).eq("id", booking.discount_id);
    }
  }

  const dateLabel = formatDateLabel(booking.scheduled_date);
  const timeLabel = formatTimeLabel(booking.scheduled_time);

  await Promise.allSettled([
    sendBookingConfirmationEmail({
      to: booking.patient_email,
      patientName: booking.patient_name,
      referenceCode: booking.reference_code,
      categoryName,
      dateLabel,
      timeLabel,
      durationMinutes: booking.duration_minutes,
      priceFinal: booking.price_final,
      meetLink: event?.meetLink,
    }),
    sendClinicNewBookingAlert({
      referenceCode: booking.reference_code,
      patientName: booking.patient_name,
      patientPhone: booking.patient_phone,
      categoryName,
      dateLabel,
      timeLabel,
      reason: booking.reason,
    }),
  ]);

  return updated;
}

export function toIso(date: string, time: string, timeZone: string, addMinutes = 0): string {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  const totalMinutes = h * 60 + m + addMinutes;
  const hh = String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0");
  const mm = String(totalMinutes % 60).padStart(2, "0");
  const offset = timeZone === "Asia/Kolkata" ? "+05:30" : "+00:00";
  return `${date}T${hh}:${mm}:00${offset}`;
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
export function formatTimeLabel(timeStr: string): string {
  const [h, m] = timeStr.slice(0, 5).split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
}
