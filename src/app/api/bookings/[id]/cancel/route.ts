import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyLookupToken } from "@/lib/tokens";
import { cancelBooking, BookingActionError } from "@/lib/booking-actions";
import { jsonError, safeMessage } from "@/lib/http";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    /* body is optional */
  }
  const token = body?.token;
  if (!token) return jsonError("Please verify your email first", 401);

  try {
    const sb = supabaseAdmin();
    const { data: booking } = await sb.from("bookings").select("patient_email").eq("id", id).maybeSingle();
    if (!booking) return jsonError("Booking not found", 404);
    if (!verifyLookupToken(token, booking.patient_email)) return jsonError("Please verify your email first", 401);

    const updated = await cancelBooking({ bookingId: id, actor: "patient" });
    return NextResponse.json({ ok: true, booking: updated });
  } catch (err) {
    const status = err instanceof BookingActionError ? 400 : 500;
    return jsonError(safeMessage(err, "Could not cancel"), status);
  }
}
