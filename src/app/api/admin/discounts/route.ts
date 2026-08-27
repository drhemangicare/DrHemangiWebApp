import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { jsonError, safeMessage } from "@/lib/http";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { data, error } = await supabaseAdmin()
    .from("discounts")
    .select("*, categories(name)")
    .order("created_at", { ascending: false });
  if (error) return jsonError(safeMessage(error), 500);
  return NextResponse.json({ discounts: data });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const body = await req.json().catch(() => ({}));
  const { category_id, label, discount_type, amount, limit_type, patient_limit, ends_at } = body;

  if (!label || !discount_type || !amount || !limit_type) {
    return jsonError("label, discount_type, amount and limit_type are required");
  }
  if (!["percent", "flat"].includes(discount_type)) return jsonError("discount_type must be percent or flat");
  if (!["patient_count", "date_range", "unlimited"].includes(limit_type)) return jsonError("Invalid limit_type");
  if (limit_type === "patient_count" && !patient_limit) return jsonError("patient_limit is required for that limit type");
  if (limit_type === "date_range" && !ends_at) return jsonError("ends_at is required for that limit type");

  const { data, error } = await supabaseAdmin()
    .from("discounts")
    .insert({
      category_id: category_id || null,
      label,
      discount_type,
      amount,
      limit_type,
      patient_limit: limit_type === "patient_count" ? patient_limit : null,
      ends_at: limit_type === "date_range" ? ends_at : null,
    })
    .select()
    .single();
  if (error) return jsonError(safeMessage(error), 500);
  return NextResponse.json({ discount: data });
}
