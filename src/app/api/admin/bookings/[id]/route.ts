import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { jsonError, safeMessage } from "@/lib/http";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;

  const sb = supabaseAdmin();
  const { data: booking, error } = await sb
    .from("bookings")
    .select("*, categories(name, price, duration_minutes), booking_documents(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) return jsonError(safeMessage(error), 500);
  if (!booking) return jsonError("Not found", 404);

  const documents = await Promise.all(
    (booking.booking_documents || []).map(async (d: any) => {
      const { data: signed } = await sb.storage.from("booking-documents").createSignedUrl(d.storage_path, 60 * 30);
      return {
        id: d.id,
        file_name: d.file_name,
        file_type: d.file_type,
        file_size_bytes: d.file_size_bytes,
        uploaded_by: d.uploaded_by,
        created_at: d.created_at,
        url: signed?.signedUrl || null,
      };
    })
  );

  return NextResponse.json({ booking: { ...booking, booking_documents: undefined, documents } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const allowed = ["doctor_notes", "status"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) if (key in body) patch[key] = body[key];
  if (!Object.keys(patch).length) return jsonError("No fields to update");

  const { data, error } = await supabaseAdmin().from("bookings").update(patch).eq("id", id).select().single();
  if (error) return jsonError(safeMessage(error), 500);
  return NextResponse.json({ booking: data });
}
