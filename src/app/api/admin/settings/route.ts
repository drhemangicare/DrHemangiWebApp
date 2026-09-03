import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { SETTINGS_TAG } from "@/lib/site/settings";
import { requireAdmin } from "@/lib/require-admin";
import { jsonError, safeMessage } from "@/lib/http";
import { isGoogleCalendarConnected } from "@/lib/google-calendar";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const { data, error } = await supabaseAdmin().from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (error) return jsonError(safeMessage(error), 500);

  let doctor_photo_url: string | null = null;
  if (data?.doctor_photo_path) {
    const { data: pub } = supabaseAdmin().storage.from("site-assets").getPublicUrl(data.doctor_photo_path);
    doctor_photo_url = pub?.publicUrl || null;
  }

  const googleConnected = await isGoogleCalendarConnected();

  return NextResponse.json({ settings: { ...data, doctor_photo_url, google_connected: googleConnected } });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const body = await req.json().catch(() => ({}));
  const allowed = [
    "clinic_address", "clinic_timing", "clinic_map_link", "doctor_bio",
    "years_experience", "deliveries_count",
    "clinic_visit_enabled", "support_email",
    "doctor_registration_no", "doctor_qualifications",
    "online_consultation_enabled",
  ];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) if (key in body) patch[key] = body[key];
  if (!Object.keys(patch).length) return jsonError("No fields to update");

  /* Upsert, not update.
     `update().eq("id",1).select().single()` matches zero rows if the settings
     row was never created, and `.single()` then fails with "JSON object
     requested, 0 rows returned" — a 500 that reads to the user as "saving does
     nothing". Upserting the id repairs a missing row instead of erroring on it. */
  const { data, error } = await supabaseAdmin()
    .from("site_settings")
    .upsert({ id: 1, ...patch }, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    /* A missing column means the database is behind the code — almost always
       a migration that has not been run. PostgREST says
       `column site_settings.clinic_visit_enabled does not exist` (PGRST204 /
       42703), which is accurate but tells the doctor nothing about what to do,
       so name the file instead. Saving *silently* doing nothing is what was
       reported, and an unexplained 500 is barely better. */
    const msg = safeMessage(error);
    const missing = /column .*?(\w+)['"]? does not exist|Could not find the '(\w+)' column/i.exec(msg);
    if (missing || (error as { code?: string }).code === "PGRST204") {
      const col = missing?.[1] || missing?.[2] || "";
      const isV5 = col === "clinic_visit_enabled" || col === "support_email" || !col;
      return jsonError(
        isV5
          ? "The database is missing the in-person-visits and support-email columns. Run supabase/migrations/0005_clinic_visit_and_support_email.sql in the Supabase SQL editor, then save again."
          : `The database is missing the "${col}" column. Run the outstanding files in supabase/migrations/ in order, then save again.`,
        409,
      );
    }
    return jsonError(msg, 500);
  }

  /* Public pages cache this row for an hour and are served from the CDN, so
     without this an edit here would not appear on the site until the window
     expired. Next 16 takes a cacheLife profile as the second argument;
     `{ expire: 0 }` means "stale now", which is what an admin edit implies. */
  revalidateTag(SETTINGS_TAG, { expire: 0 });
  return NextResponse.json({ settings: data });
}
