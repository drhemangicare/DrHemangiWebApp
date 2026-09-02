import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { SETTINGS_TAG } from "@/lib/site/settings";
import { requireAdmin } from "@/lib/require-admin";
import { jsonError, safeMessage } from "@/lib/http";
import { compressIfImage } from "@/lib/uploads";

// Doctor's photo placeholder → real photo. Uploaded once from Admin →
// Settings; stored in the public "site-assets" bucket so the homepage can
// show it with a plain <img src>, no signed URLs needed.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  /* Parsing the multipart body has to be guarded. It was outside the try
     below, so a body big enough to blow the request limit threw before the
     size check further down could ever run — the browser got a bare 500 with
     no JSON body at all, and the doctor got no message. */
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError("That file was too large to upload. Please use an image under 12 MB.", 413);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("No file provided");
  if (!file.type.startsWith("image/")) return jsonError("Please upload an image file");
  /* 12 MB of *input*, because it is re-encoded below before it reaches
     storage. The bucket itself caps objects at 5 MB (migration 0002) and a
     phone photo is routinely 4–8 MB, so the old 8 MB input limit let files
     through that the bucket then rejected — an upload that failed for a
     reason the doctor could not act on. What matters is the compressed size,
     which is checked after re-encoding. */
  if (file.size > 12 * 1024 * 1024) return jsonError("Image is too large (max 12 MB)");

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const { buffer, mimeType, extension } = await compressIfImage(buf, file.type);

    /* The bucket only accepts jpeg/png/webp. `compressIfImage` normally
       returns JPEG, but it falls back to the original bytes if sharp throws —
       and an HEIC straight off an iPhone would then be rejected by storage
       with an opaque error. Catch it here where we can say what to do. */
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      return jsonError(
        "That image format could not be processed. Please save it as JPEG or PNG and try again.",
      );
    }
    if (buffer.byteLength > 5 * 1024 * 1024) {
      return jsonError("Image is still over 5 MB after compression. Please crop or resize it first.");
    }

    const path = `doctor-photo.${extension}`;
    const sb = supabaseAdmin();
    const { error: upErr } = await sb.storage.from("site-assets").upload(path, buffer, {
      contentType: mimeType,
      upsert: true,
    });
    if (upErr) {
      const m = safeMessage(upErr);
      if (/bucket.*not.*found/i.test(m)) {
        return jsonError(
          "The site-assets storage bucket does not exist. Run supabase/migrations/0002_storage.sql, then try again.",
          409,
        );
      }
      throw upErr;
    }

    /* This write was previously unchecked, and it is the step that actually
       makes the photo appear: the file can upload perfectly and the site still
       shows the placeholder, because the path was never recorded. Upserted for
       the same reason as the settings PATCH — a missing row must repair rather
       than silently match nothing. */
    const { error: dbErr } = await sb
      .from("site_settings")
      .upsert({ id: 1, doctor_photo_path: path }, { onConflict: "id" });
    if (dbErr) {
      return jsonError(
        `The photo uploaded but could not be saved to settings: ${safeMessage(dbErr)}`,
        500,
      );
    }

    /* Without this the public site keeps serving the previous photo for up to
       an hour from its cached copy, which looks exactly like the upload having
       failed. The settings PATCH already did this; the photo route did not. */
    revalidateTag(SETTINGS_TAG, { expire: 0 });

    const { data: pub } = sb.storage.from("site-assets").getPublicUrl(path);
    /* Cache-bust the <img> too. The path is always `doctor-photo.jpg`, so the
       browser (and Vercel's image cache) would otherwise show the old file at
       the same URL after a replacement. */
    const url = pub?.publicUrl ? `${pub.publicUrl}?v=${Date.now()}` : null;
    return NextResponse.json({ doctor_photo_url: url });
  } catch (err) {
    return jsonError(safeMessage(err, "Upload failed"), 500);
  }
}
