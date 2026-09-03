import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { jsonError, safeMessage } from "@/lib/http";
import { normalisePrescription } from "@/lib/prescriptions";

/* THIS ROUTE ONLY SAVES. Sending lives at ./send, and that endpoint accepts no
   prescription content whatsoever — it emails the row that is already stored.
   
   That split is the enforcement. Previously one route took the form contents
   and a `send: true` flag, so "send" and "save what is on screen" were the
   same request: a client could send content that had never been reviewed as a
   saved draft, and a UI bug could send silently. Now the only thing that can
   reach a patient is a row that was written first and read back, which is a
   property of the API rather than a rule the frontend is trusted to follow. */

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;

  const { data, error } = await supabaseAdmin()
    .from("prescriptions")
    .select("*")
    .eq("booking_id", id)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) return migrationNeeded();
    return jsonError(safeMessage(error), 500);
  }
  return NextResponse.json({ prescription: data ?? null });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const parsed = normalisePrescription(body);
  if ("error" in parsed) return jsonError(parsed.error);
  const value = parsed.value;
  const sb = supabaseAdmin();

  /* The booking is needed for the patient's name and address, and it is also
     the authorisation check that matters clinically: a prescription may only
     exist against a real consultation. */
  const { data: booking, error: bErr } = await sb
    .from("bookings")
    .select("id, patient_name, patient_email, patient_age, reference_code, scheduled_date, status")
    .eq("id", id)
    .maybeSingle();
  if (bErr) return jsonError(safeMessage(bErr), 500);
  if (!booking) return jsonError("That booking no longer exists.", 404);

  // 1. Write first, so nothing the doctor typed is lost if the email fails.
  const { data: saved, error: sErr } = await sb
    .from("prescriptions")
    .upsert(
      {
        booking_id: id,
        diagnosis: value.diagnosis,
        medicines: value.medicines,
        advice: value.advice,
        follow_up_date: value.follow_up_date,
        created_by: admin.id,
      },
      { onConflict: "booking_id" },
    )
    .select()
    .single();

  if (sErr) {
    if (isMissingTable(sErr)) return migrationNeeded();
    return jsonError(`Could not save the prescription: ${safeMessage(sErr)}`, 500);
  }

  return NextResponse.json({ prescription: saved, sent: false });
}

function isMissingTable(error: unknown): boolean {
  const e = error as { code?: string; message?: string };
  return e?.code === "42P01" || /relation .*prescriptions.* does not exist|Could not find the table/i.test(e?.message || "");
}

function migrationNeeded() {
  return jsonError(
    "The prescriptions table does not exist yet. Run supabase/migrations/0006_prescriptions.sql in the Supabase SQL editor, then try again.",
    409,
  );
}
