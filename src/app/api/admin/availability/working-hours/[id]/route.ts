import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { jsonError, safeMessage } from "@/lib/http";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const allowed = ["weekday", "start_time", "end_time", "slot_duration_minutes", "is_active"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) if (key in body) patch[key] = body[key];
  const { data, error } = await supabaseAdmin().from("working_hours").update(patch).eq("id", id).select().single();
  if (error) return jsonError(safeMessage(error), 500);
  return NextResponse.json({ working_hours: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;
  const { error } = await supabaseAdmin().from("working_hours").delete().eq("id", id);
  if (error) return jsonError(safeMessage(error), 500);
  return NextResponse.json({ ok: true });
}
