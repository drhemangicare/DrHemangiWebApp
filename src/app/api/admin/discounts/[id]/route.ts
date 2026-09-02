import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { jsonError, safeMessage } from "@/lib/http";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const allowed = ["label", "discount_type", "amount", "limit_type", "patient_limit", "ends_at", "is_active", "category_id"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) if (key in body) patch[key] = body[key];
  if (!Object.keys(patch).length) return jsonError("No fields to update");

  const { data, error } = await supabaseAdmin().from("discounts").update(patch).eq("id", id).select().single();
  if (error) return jsonError(safeMessage(error), 500);
  return NextResponse.json({ discount: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;
  const { error } = await supabaseAdmin().from("discounts").delete().eq("id", id);
  if (error) return jsonError(safeMessage(error), 500);
  return NextResponse.json({ ok: true });
}
