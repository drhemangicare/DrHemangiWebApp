import { supabaseAdmin } from "@/lib/supabase/server";
import { isSlotAvailable } from "@/lib/availability";
import { updateConsultEvent, cancelConsultEvent } from "@/lib/google-calendar";
import { sendRescheduleEmail, sendCancellationEmail } from "@/lib/brevo";
import { toIso, formatDateLabel, formatTimeLabel } from "@/lib/confirm-booking";

export const PATIENT_RESCHEDULE_MIN_NOTICE_HOURS = 6;
export const PATIENT_CANCEL_FULL_REFUND_HOURS = 24;

export class BookingActionError extends Error {}

export async function rescheduleBooking(opts: {
  bookingId: string;
  newDate: string;
  newTime: string;
  actor: "patient" | "admin";
}) {
  const sb = supabaseAdmin();
  const { data: booking, error } = await sb.from("bookings").select("*, categories(name)").eq("id", opts.bookingId).maybeSingle();
  if (error) throw error;
  if (!booking) throw new BookingActionError("Booking not found");
  if (booking.status === "cancelled") throw new BookingActionError("This booking is cancelled");

  if (opts.actor === "patient") {
    const startsAt = new Date(`${booking.scheduled_date}T${booking.scheduled_time.slice(0, 5)}:00`);
    const hoursUntil = (startsAt.getTime() - Date.now()) / 3_600_000;
    if (hoursUntil < PATIENT_RESCHEDULE_MIN_NOTICE_HOURS) {
      throw new BookingActionError(
        `Online rescheduling closes ${PATIENT_RESCHEDULE_MIN_NOTICE_HOURS} hours before your slot — please call the clinic directly.`
      );
    }
  }

  const available = await isSlotAvailable(booking.category_id, opts.newDate, opts.newTime);
  if (!available) throw new BookingActionError("That slot isn't available — please pick another time");

  let meetLink = booking.meet_link;
  if (booking.calendar_event_id) {
    const startIso = toIso(opts.newDate, opts.newTime, "Asia/Kolkata");
    const endIso = toIso(opts.newDate, opts.newTime, "Asia/Kolkata", booking.duration_minutes);
    const result = await updateConsultEvent({ eventId: booking.calendar_event_id, startIso, endIso });
    if (result?.meetLink) meetLink = result.meetLink;
  }

  const { data: updated, error: updateErr } = await sb
    .from("bookings")
    .update({
      scheduled_date: opts.newDate,
      scheduled_time: opts.newTime,
      status: "confirmed",
      reschedule_count: (booking.reschedule_count || 0) + 1,
      meet_link: meetLink,
    })
    .eq("id", opts.bookingId)
    .select()
    .single();
  if (updateErr) throw updateErr;

  await sendRescheduleEmail({
    to: booking.patient_email,
    patientName: booking.patient_name,
    referenceCode: booking.reference_code,
    categoryName: booking.categories?.name || "Consultation",
    dateLabel: formatDateLabel(opts.newDate),
    timeLabel: formatTimeLabel(opts.newTime),
    meetLink,
  }).catch(() => null);

  return updated;
}

export async function cancelBooking(opts: { bookingId: string; actor: "patient" | "admin" }) {
  const sb = supabaseAdmin();
  const { data: booking, error } = await sb.from("bookings").select("*, categories(name)").eq("id", opts.bookingId).maybeSingle();
  if (error) throw error;
  if (!booking) throw new BookingActionError("Booking not found");
  if (booking.status === "cancelled") return booking;

  if (booking.calendar_event_id) {
    await cancelConsultEvent(booking.calendar_event_id).catch(() => null);
  }

  const { data: updated, error: updateErr } = await sb
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", opts.bookingId)
    .select()
    .single();
  if (updateErr) throw updateErr;

  await sendCancellationEmail({
    to: booking.patient_email,
    patientName: booking.patient_name,
    referenceCode: booking.reference_code,
    categoryName: booking.categories?.name || "Consultation",
  }).catch(() => null);

  return updated;
}
