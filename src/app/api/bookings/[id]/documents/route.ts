import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyLookupToken } from "@/lib/tokens";
import { jsonError, safeMessage } from "@/lib/http";
import { ALLOWED_TYPES, MAX_FILES_PER_REQUEST, MAX_FILE_BYTES, compressIfImage, sanitizeFileName, sniffMime } from "@/lib/uploads";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const FRESH_BOOKING_WINDOW_MS = 30 * 60 * 1000;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const sb = supabaseAdmin();
    const { data: booking } = await sb
      .from("bookings")
      .select("id, patient_email, created_at, status")
      .eq("id", id)
      .maybeSingle();
    if (!booking) return jsonError("Booking not found", 404);

    // Anyone can create a booking, so the "fresh unpaid booking" escape hatch
    // meant uploads to a brand-new booking needed no token at all for 30
    // minutes — 8 files x 15 MB per request, unlimited requests, against a
    // 1 GB storage tier, and it let anyone who learned a booking id plant
    // files on a stranger's record inside that window. The window stays
    // (the wizard uploads before payment, before an OTP exists) but it is now
    // rate limited per IP and narrowed.
    const form = await req.formData();
    const token = String(form.get("token") || "");
    const isFreshUnpaidBooking =
      booking.status === "pending_payment" &&
      Date.now() - new Date(booking.created_at).getTime() < FRESH_BOOKING_WINDOW_MS;
    const ownsBooking = token && verifyLookupToken(token, booking.patient_email);

    if (!isFreshUnpaidBooking && !ownsBooking) {
      return jsonError("Please verify your email to add reports to this booking", 401);
    }
    if (!ownsBooking) {
      const lim = await rateLimit("doc_upload_ip", clientIp(req), 12, 3600);
      if (!lim.ok) return jsonError("Too many uploads from this network — please try again later", 429);
    }

    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (!files.length) return jsonError("No files provided");
    if (files.length > MAX_FILES_PER_REQUEST) return jsonError(`Please upload at most ${MAX_FILES_PER_REQUEST} files at a time`);

    const uploaded: { file_name: string; file_type: string }[] = [];
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) continue; // silently skip oversized files rather than failing the whole batch
      // file.type is the client-supplied multipart Content-Type and is
      // trivially spoofed. Check the actual bytes and use the sniffed type
      // from here on, so arbitrary content can't be stored and later served
      // back to the doctor as application/pdf.
      if (!ALLOWED_TYPES.has(file.type)) continue;
      const arrayBuffer = await file.arrayBuffer();
      const raw = Buffer.from(arrayBuffer);
      const sniffed = sniffMime(raw);
      if (!sniffed || !ALLOWED_TYPES.has(sniffed)) continue;

      const { buffer, mimeType, extension } = await compressIfImage(raw, sniffed);
      const safeName = sanitizeFileName(file.name || `report.${extension}`);
      const storagePath = `${id}/${Date.now()}-${safeName}`;

      const { error: upErr } = await sb.storage.from("booking-documents").upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });
      if (upErr) {
        console.error("Storage upload failed:", upErr);
        continue;
      }

      await sb.from("booking_documents").insert({
        booking_id: id,
        file_name: file.name || safeName,
        storage_path: storagePath,
        file_type: mimeType,
        file_size_bytes: buffer.byteLength,
        uploaded_by: "patient",
      });
      uploaded.push({ file_name: file.name || safeName, file_type: mimeType });
    }

    return NextResponse.json({ uploaded });
  } catch (err) {
    return jsonError(safeMessage(err, "Upload failed"), 500);
  }
}
