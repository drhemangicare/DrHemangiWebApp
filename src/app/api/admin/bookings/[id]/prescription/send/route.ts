import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { jsonError, safeMessage } from "@/lib/http";
import { isSendable, type Medicine } from "@/lib/prescriptions";
import { sendPrescriptionEmail } from "@/lib/brevo";
import { getPublicSettings } from "@/lib/site/settings";
import { buildPrescriptionPdf } from "@/lib/prescription-pdf";

export const runtime = "nodejs"; // pdfkit needs Node streams and Buffer

/**
 * Email the SAVED prescription to the patient.
 *
 * ── THIS ENDPOINT TAKES NO PRESCRIPTION CONTENT, ON PURPOSE ───────────────
 * It reads the stored row and sends that. There is no body to supply, so
 * there is no way for a client — a UI bug, a stale tab, a curl command — to
 * send text that was never saved and reviewed as a draft. "You must save
 * before you can send" stops being a rule the frontend is trusted to follow
 * and becomes a property of the API surface.
 *
 * The optional `expectedUpdatedAt` is the second half of that guarantee: it
 * lets the client say *which* saved version it believes it is sending. If the
 * row has moved on since (another tab saved, or the save the doctor thinks
 * she made actually failed), the send is refused rather than quietly mailing
 * a different document than the one on her screen.
 */
function dateLabel(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;

  const body = (await req.json().catch(() => ({}))) as { expectedUpdatedAt?: string };
  const sb = supabaseAdmin();

  const [{ data: booking, error: bErr }, { data: rx, error: rErr }] = await Promise.all([
    sb
      .from("bookings")
      .select("patient_name, patient_email, patient_age, reference_code, scheduled_date")
      .eq("id", id)
      .maybeSingle(),
    sb.from("prescriptions").select("*").eq("booking_id", id).maybeSingle(),
  ]);

  if (bErr) return jsonError(safeMessage(bErr), 500);
  if (!booking) return jsonError("That booking no longer exists.", 404);
  if (rErr) return jsonError(safeMessage(rErr), 500);

  /* Nothing saved = nothing to send. This is the check the old design could
     not make, because the content arrived in the same request as the send. */
  if (!rx) {
    return jsonError("Save the prescription first — there is no saved draft to send.", 409);
  }

  const value = {
    diagnosis: rx.diagnosis || "",
    medicines: (rx.medicines || []) as Medicine[],
    advice: rx.advice || "",
    follow_up_date: rx.follow_up_date ?? null,
  };
  if (!isSendable(value)) {
    return jsonError("The saved prescription is empty — add a medicine, a diagnosis or some advice, then save.", 409);
  }

  /* Optimistic concurrency: refuse to send a version the client has not seen. */
  if (body.expectedUpdatedAt && rx.updated_at && body.expectedUpdatedAt !== rx.updated_at) {
    return jsonError(
      "This prescription changed after you last saved it — reload the booking, check the content, and send again.",
      409,
    );
  }

  if (!booking.patient_email) {
    return jsonError("This booking has no email address on it, so the prescription cannot be sent.", 409);
  }

  let pdfWarning: string | null = null;
  try {
    const settings = await getPublicSettings();
    const { buffer, removed } = await buildPrescriptionPdf({
      patientName: booking.patient_name || "",
      patientAge: (booking.patient_age as number | null) ?? null,
      referenceCode: booking.reference_code || "",
      consultDateLabel: dateLabel(booking.scheduled_date),
      diagnosis: value.diagnosis,
      medicines: value.medicines,
      advice: value.advice,
      followUpLabel: value.follow_up_date ? dateLabel(value.follow_up_date) : null,
      doctorName: "Dr Hemangi",
      qualifications: settings.doctor_qualifications,
      registrationNo: settings.doctor_registration_no,
      clinicAddress: settings.clinic_address,
      supportEmail: settings.support_email,
    });

    if (removed.length) {
      pdfWarning =
        `The attached PDF could not print these characters: ${removed.join(" ")}. ` +
        `They are correct in the email itself.`;
    }

    await sendPrescriptionEmail({
      pdf: { name: `prescription-${booking.reference_code || "dr-hemangi"}.pdf`, content: buffer },
      to: booking.patient_email,
      patientName: booking.patient_name || "there",
      referenceCode: booking.reference_code || "",
      consultDateLabel: dateLabel(booking.scheduled_date),
      diagnosis: value.diagnosis,
      medicines: value.medicines,
      advice: value.advice,
      followUpLabel: value.follow_up_date ? dateLabel(value.follow_up_date) : null,
      doctorName: "Dr Hemangi",
      qualifications: settings.doctor_qualifications,
      registrationNo: settings.doctor_registration_no,
      supportEmail: settings.support_email,
    });
  } catch (err) {
    /* The draft is untouched and still saved — say so, so nobody retypes it. */
    return jsonError(
      `The saved prescription could not be emailed: ${safeMessage(err)}. Nothing was lost — press Send again.`,
      502,
    );
  }

  const { data: finalRow, error: uErr } = await sb
    .from("prescriptions")
    .update({
      sent_at: new Date().toISOString(),
      sent_to: booking.patient_email,
      revision: (rx.revision ?? 0) + 1,
    })
    .eq("booking_id", id)
    .select()
    .single();

  /* It is already in the patient's inbox; a bookkeeping failure is not a send
     failure and must never be reported as one. */
  if (uErr) {
    return NextResponse.json({
      prescription: rx,
      sent: true,
      warning: ["Sent, but the delivery record could not be updated.", pdfWarning].filter(Boolean).join(" "),
    });
  }

  return NextResponse.json({ prescription: finalRow, sent: true, warning: pdfWarning ?? undefined });
}
