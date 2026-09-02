import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { rescheduleBooking, BookingActionError } from "@/lib/booking-actions";
import { jsonError, safeMessage } from "@/lib/http";

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
