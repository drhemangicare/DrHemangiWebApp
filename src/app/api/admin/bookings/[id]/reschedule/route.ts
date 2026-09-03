import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { rescheduleBooking, BookingActionError } from "@/lib/booking-actions";
import { jsonError, safeMessage } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase/server";
import { computeAvailability } from "@/lib/availability";

/**
 * The free slots this booking could move to.
 *
 * The admin panel used to offer a bare date box and a bare time box, so the
 * doctor could type any time at all — and `rescheduleBooking` only accepts a
 * time that exists on the generated slot grid for that category. Anything off
 * the grid (11:37, or 11:30 when the day starts at 11:15) was rejected, and
 * because the UI threw the response away it looked like the button did
 * nothing. Offering the real slots removes the guesswork entirely.
 *
 * The booking's own id is excluded, so the slot it currently occupies is
 * offered back rather than appearing taken by itself.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;

  const { data: booking, error } = await supabaseAdmin()
    .from("bookings")
    .select("category_id")
    .eq("id", id)
    .maybeSingle();
  if (error) return jsonError(safeMessage(error), 500);
  if (!booking) return jsonError("Booking not found", 404);

  const days = await computeAvailability(booking.category_id, 45, id);
  return NextResponse.json({
    days: days
      .map((d) => ({ ...d, slots: d.slots.filter((s) => s.available) }))
      .filter((d) => d.slots.length > 0),
  });
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { date, time } = body;
  if (!DATE_RE.test(date) || !TIME_RE.test(time)) return jsonError("A valid date and time are required");

  try {
    const updated = await rescheduleBooking({ bookingId: id, newDate: date, newTime: time, actor: "admin" });
    return NextResponse.json({ ok: true, booking: updated });
  } catch (err) {
    const status = err instanceof BookingActionError ? 400 : 500;
    return jsonError(safeMessage(err, "Could not reschedule"), status);
  }
}
