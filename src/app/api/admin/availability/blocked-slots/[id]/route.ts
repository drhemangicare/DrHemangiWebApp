import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { jsonError, safeMessage } from "@/lib/http";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { id } = await params;
  const { error } = await supabaseAdmin().from("blocked_slots").delete().eq("id", id);
  if (error) return jsonError(safeMessage(error), 500);
  return NextResponse.json({ ok: true });
}
