import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { cancelBooking, BookingActionError } from "@/lib/booking-actions";
import { jsonError, safeMessage } from "@/lib/http";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;

  try {
    const updated = await cancelBooking({ bookingId: id, actor: "admin" });
    return NextResponse.json({ ok: true, booking: updated });
  } catch (err) {
    const status = err instanceof BookingActionError ? 400 : 500;
    return jsonError(safeMessage(err, "Could not cancel"), status);
  }
}
