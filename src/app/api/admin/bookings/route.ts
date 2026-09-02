import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { jsonError, safeMessage } from "@/lib/http";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const categoryId = sp.get("category_id");
  const from = sp.get("from");
  const to = sp.get("to");
  const q = sp.get("q");
  const limit = Math.min(200, Number(sp.get("limit") || 100));

  let query = supabaseAdmin()
    .from("bookings")
    .select("*, categories(name), booking_documents(id)")
    .order("scheduled_date", { ascending: false })
    .order("scheduled_time", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (from) query = query.gte("scheduled_date", from);
  if (to) query = query.lte("scheduled_date", to);
  if (q) {
    // The search string is interpolated straight into PostgREST filter syntax,
    // so characters like "," "(" ")" and "." let a signed-in staff member (or
    // anyone who lands a request through their session) rewrite the predicate.
    // Strip everything that carries meaning in that grammar before use.
    const safeQ = q.replace(/[,()".*\\]/g, " ").trim().slice(0, 80);
    if (safeQ) {
      query = query.or(
        `patient_name.ilike.%${safeQ}%,patient_email.ilike.%${safeQ}%,patient_phone.ilike.%${safeQ}%,reference_code.ilike.%${safeQ}%`
      );
    }
  }

  const { data, error } = await query;
  if (error) return jsonError(safeMessage(error), 500);

  const out = (data || []).map((b: any) => ({
    id: b.id,
    reference_code: b.reference_code,
    category_name: b.categories?.name || "Consultation",
    category_id: b.category_id,
    patient_name: b.patient_name,
    patient_email: b.patient_email,
    patient_phone: b.patient_phone,
    scheduled_date: b.scheduled_date,
    scheduled_time: b.scheduled_time,
    duration_minutes: b.duration_minutes,
    status: b.status,
    payment_status: b.payment_status,
    price_final: b.price_final,
    document_count: (b.booking_documents || []).length,
    created_at: b.created_at,
  }));

  return NextResponse.json({ bookings: out });
}
