import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { safeMessage } from "@/lib/http";

/**
 * Why the doctor's photo is not showing — answered by the app instead of guessed.
 *
 * "The photo is not visible" has at least five distinct causes, and from the
 * outside they look identical. Each one below is checked in the order the
 * photo actually travels, and the FIRST failing step is the answer:
 *
 *   1. the settings row exists at all
 *   2. `doctor_photo_path` is recorded on it        (the upload's DB write)
 *   3. the object is really in the `site-assets` bucket (the upload itself)
 *   4. the bucket is PUBLIC — migration 0002 creates it public, but it ends
 *      with `on conflict (id) do nothing`, so a bucket someone had already
 *      created by hand keeps whatever visibility it was made with, and
 *      `getPublicUrl()` returns a perfectly normal-looking URL either way
 *   5. that URL actually returns an image when fetched
 *
 * Step 5 is the one no amount of reading the code can settle, which is the
 * whole reason this endpoint fetches the URL rather than just building it.
 */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const steps: { step: string; ok: boolean; detail: string }[] = [];
  const add = (step: string, ok: boolean, detail: string) => steps.push({ step, ok, detail });

  const sb = supabaseAdmin();
  let path: string | null = null;

  // 1 + 2 — the settings row and the recorded path
  try {
    const { data, error } = await sb
      .from("site_settings")
      .select("doctor_photo_path")
      .eq("id", 1)
      .maybeSingle();
    if (error) {
      add("Database row", false, `Could not read site_settings: ${safeMessage(error)}`);
      return NextResponse.json({ ok: false, steps });
    }
    if (!data) {
      add("Database row", false, "No site_settings row with id = 1. Save any setting once to create it.");
      return NextResponse.json({ ok: false, steps });
    }
    add("Database row", true, "site_settings row found.");

    path = (data.doctor_photo_path as string | null) ?? null;
    if (!path) {
      add(
        "Photo recorded",
        false,
        "doctor_photo_path is empty — the upload never got as far as saving. Re-upload the photo and watch for an error message.",
      );
      return NextResponse.json({ ok: false, steps });
    }
    add("Photo recorded", true, `doctor_photo_path = "${path}"`);
  } catch (err) {
    add("Database row", false, safeMessage(err));
    return NextResponse.json({ ok: false, steps });
  }

  // 3 — is the object actually in the bucket?
  try {
    const { data: listed, error } = await sb.storage.from("site-assets").list("", { limit: 100 });
    if (error) {
      add("File in storage", false, `Could not list the site-assets bucket: ${safeMessage(error)}`);
    } else {
      const hit = listed?.find((o) => o.name === path);
      add(
        "File in storage",
        !!hit,
        hit
          ? `Found "${path}" (${Math.round((hit.metadata?.size ?? 0) / 1024)} KB).`
          : `"${path}" is recorded in the database but is NOT in the bucket. Re-upload the photo.`,
      );
    }
  } catch (err) {
    add("File in storage", false, safeMessage(err));
  }

  // 4 — is the bucket public?
  try {
    const { data: bucket, error } = await sb.storage.getBucket("site-assets");
    if (error) {
      add("Bucket is public", false, `Could not read the bucket: ${safeMessage(error)}`);
    } else {
      add(
        "Bucket is public",
        !!bucket?.public,
        bucket?.public
          ? "site-assets is public, so the photo can be served directly."
          : "site-assets is PRIVATE. This is the usual cause. In Supabase → Storage → site-assets → Settings, turn on 'Public bucket'. (Migration 0002 only creates the bucket public; it cannot change one that already existed.)",
      );
    }
  } catch (err) {
    add("Bucket is public", false, safeMessage(err));
  }

  // 5 — does the URL actually return an image?
  const { data: pub } = sb.storage.from("site-assets").getPublicUrl(path);
  const url = pub?.publicUrl ?? null;
  if (!url) {
    add("Photo loads", false, "Could not build a public URL for the file.");
  } else {
    try {
      const res = await fetch(`${url}?probe=${Date.now()}`, { method: "GET", cache: "no-store" });
      const type = res.headers.get("content-type") ?? "";
      add(
        "Photo loads",
        res.ok && type.startsWith("image/"),
        res.ok
          ? type.startsWith("image/")
            ? `Loads fine (${type}).`
            : `The URL responded but is not an image (${type || "unknown type"}).`
          : `The photo URL returned HTTP ${res.status}. If that is 400, the bucket is private.`,
      );
    } catch (err) {
      add("Photo loads", false, `Could not fetch the photo URL: ${safeMessage(err)}`);
    }
  }

  return NextResponse.json({ ok: steps.every((s) => s.ok), url, steps });
}
