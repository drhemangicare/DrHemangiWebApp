import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { jsonError, safeMessage } from "@/lib/http";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const allowed = [
    "slug",
    "name",
    "description",
    "icon",
    "price",
    "duration_minutes",
    "sort_order",
    "is_active",
    "existing_patients_only",
  ];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) if (key in body) patch[key] = body[key];
  if (!Object.keys(patch).length) return jsonError("No fields to update");

  const { data, error } = await supabaseAdmin().from("categories").update(patch).eq("id", id).select().single();
  if (error) return jsonError(safeMessage(error), 500);
  return NextResponse.json({ category: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;
  // Soft-delete: keep historical bookings intact, just stop offering it.
  const { error } = await supabaseAdmin().from("categories").update({ is_active: false }).eq("id", id);
  if (error) return jsonError(safeMessage(error), 500);
  return NextResponse.json({ ok: true });
}
