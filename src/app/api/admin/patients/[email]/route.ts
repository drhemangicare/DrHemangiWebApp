import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { jsonError, safeMessage } from "@/lib/http";

/**
 * One patient's whole history, in a single request.
 *
 * The brief was that the history "should not require navigating through
 * multiple unrelated pages", so everything a doctor needs before a
 * consultation comes back together: every visit, with its reason, the doctor's
 * notes, the prescription written that day, the follow-up and any uploaded
 * reports. One query with two embedded relations rather than one request per
 * visit — the N+1 version would be a dozen round trips for a regular patient.
 */
type PrescriptionRow = {
  diagnosis: string | null;
  medicines: { name: string; dose: string; frequency: string; duration: string; notes: string }[] | null;
  advice: string | null;
  follow_up_date: string | null;
  sent_at: string | null;
  updated_at: string | null;
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const { email: raw } = await params;
  const email = decodeURIComponent(raw || "").trim().toLowerCase();
  if (!email) return jsonError("No patient specified");

  const sb = supabaseAdmin();

  /* `ilike` with no wildcards is an exact, case-insensitive match — the same
     way the patient's own /bookings lookup finds them, so the admin sees
     exactly the set of visits the patient can see. */
  let { data, error } = await sb
    .from("bookings")
    .select(
      "id, reference_code, patient_name, patient_email, patient_phone, patient_age, reason, doctor_notes, " +
        "scheduled_date, scheduled_time, duration_minutes, status, payment_status, price_final, meet_link, " +
        "categories(name), prescriptions(diagnosis, medicines, advice, follow_up_date, sent_at, updated_at), " +
        "booking_documents(id)",
    )
    .ilike("patient_email", email)
    .order("scheduled_date", { ascending: false })
    .order("scheduled_time", { ascending: false });

  /* The prescriptions relation only exists once migration 0006 has been run.
     Retry without it rather than showing the doctor an error page — the visit
     history is still worth seeing without the prescription column. */
  let prescriptionsAvailable = true;
  if (error) {
    prescriptionsAvailable = false;
    ({ data, error } = await sb
      .from("bookings")
      .select(
        "id, reference_code, patient_name, patient_email, patient_phone, patient_age, reason, doctor_notes, " +
          "scheduled_date, scheduled_time, duration_minutes, status, payment_status, price_final, meet_link, " +
          "categories(name), booking_documents(id)",
      )
      .ilike("patient_email", email)
      .order("scheduled_date", { ascending: false })
      .order("scheduled_time", { ascending: false }));
  }

  if (error) return jsonError(safeMessage(error), 500);
  if (!data || data.length === 0) return jsonError("No visits found for that patient.", 404);

  const rows = data as unknown as (Record<string, unknown> & {
    categories?: { name: string } | null;
    prescriptions?: PrescriptionRow[] | PrescriptionRow | null;
    booking_documents?: { id: string }[] | null;
  })[];

  const visits = rows.map((b) => {
    /* PostgREST returns a one-to-one embed as an array or an object depending
       on how it infers the relationship — normalise both. */
    const rx = Array.isArray(b.prescriptions) ? (b.prescriptions[0] ?? null) : (b.prescriptions ?? null);
    return {
      id: b.id as string,
      reference_code: b.reference_code as string,
      date: b.scheduled_date as string,
      time: String(b.scheduled_time ?? "").slice(0, 5),
      duration_minutes: b.duration_minutes as number,
      service: b.categories?.name ?? "Consultation",
      status: b.status as string,
      payment_status: b.payment_status as string,
      price_final: b.price_final as number,
      reason: (b.reason as string) || "",
      doctor_notes: (b.doctor_notes as string) || "",
      meet_link: (b.meet_link as string) || null,
      document_count: (b.booking_documents || []).length,
      prescription: rx
        ? {
            diagnosis: rx.diagnosis || "",
            medicines: rx.medicines || [],
            advice: rx.advice || "",
            follow_up_date: rx.follow_up_date,
            sent_at: rx.sent_at,
          }
        : null,
    };
  });

  const newest = rows[0];
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = visits.filter((v) => v.date > today && v.status !== "cancelled");
  const past = visits.filter((v) => !(v.date > today && v.status !== "cancelled"));

  return NextResponse.json({
    patient: {
      name: newest.patient_name as string,
      email: newest.patient_email as string,
      phone: newest.patient_phone as string,
      age: (newest.patient_age as number | null) ?? null,
      total_visits: visits.length,
      first_seen: visits[visits.length - 1]?.date ?? null,
      last_seen: past[0]?.date ?? null,
      /* The most recent follow-up date the doctor set, so it is visible
         without opening every prescription. */
      next_follow_up:
        visits.map((v) => v.prescription?.follow_up_date).filter((d): d is string => !!d && d >= today).sort()[0] ??
        null,
    },
    upcoming,
    past,
    prescriptionsAvailable,
  });
}
