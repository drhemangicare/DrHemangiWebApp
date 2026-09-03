import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { jsonError, safeMessage } from "@/lib/http";
import { buildPrescriptionPdf } from "@/lib/prescription-pdf";
import { getPublicSettings } from "@/lib/site/settings";
import type { Medicine } from "@/lib/prescriptions";

export const runtime = "nodejs";

/**
 * The saved prescription as a PDF, for the doctor to check before sending.
 *
 * Built from the SAVED row, not from the browser's form state, so what she
 * previews is exactly the document the patient will receive — previewing
 * unsaved edits would be reassuring and wrong.
 */
function dateLabel(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;

  const sb = supabaseAdmin();
  const [{ data: booking, error: bErr }, { data: rx, error: rErr }] = await Promise.all([
    sb
      .from("bookings")
      .select("patient_name, patient_age, reference_code, scheduled_date")
      .eq("id", id)
      .maybeSingle(),
    sb.from("prescriptions").select("*").eq("booking_id", id).maybeSingle(),
  ]);

  if (bErr) return jsonError(safeMessage(bErr), 500);
  if (!booking) return jsonError("Booking not found", 404);
  if (rErr) return jsonError(safeMessage(rErr), 500);
  if (!rx) return jsonError("Save the prescription first — there is nothing to preview yet.", 404);

  const settings = await getPublicSettings();
  const { buffer } = await buildPrescriptionPdf({
    patientName: booking.patient_name || "",
    patientAge: (booking.patient_age as number | null) ?? null,
    referenceCode: booking.reference_code || "",
    consultDateLabel: dateLabel(booking.scheduled_date),
    diagnosis: rx.diagnosis || "",
    medicines: (rx.medicines || []) as Medicine[],
    advice: rx.advice || "",
    followUpLabel: rx.follow_up_date ? dateLabel(rx.follow_up_date) : null,
    doctorName: "Dr Hemangi",
    qualifications: settings.doctor_qualifications,
    registrationNo: settings.doctor_registration_no,
    clinicAddress: settings.clinic_address,
    supportEmail: settings.support_email,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      // inline so it opens in a tab rather than downloading
      "Content-Disposition": `inline; filename="prescription-${booking.reference_code || "dr-hemangi"}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
