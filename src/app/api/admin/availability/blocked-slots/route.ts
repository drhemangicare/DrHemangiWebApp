import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { jsonError, safeMessage } from "@/lib/http";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const from = req.nextUrl.searchParams.get("from") || new Date().toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin()
    .from("blocked_slots")
    .select("*")
    .gte("block_date", from)
    .order("block_date", { ascending: true });
  if (error) return jsonError(safeMessage(error), 500);
  return NextResponse.json({ blocked_slots: data });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const body = await req.json().catch(() => ({}));
  const { block_date, whole_day, start_time, end_time, reason } = body;
  if (!block_date) return jsonError("block_date is required");
  if (!whole_day && (!start_time || !end_time)) return jsonError("start_time and end_time are required for a partial-day block");

  const { data, error } = await supabaseAdmin()
    .from("blocked_slots")
    .insert({
      block_date,
      whole_day: whole_day !== false,
      start_time: whole_day === false ? start_time : null,
      end_time: whole_day === false ? end_time : null,
      reason: reason || null,
    })
    .select()
    .single();
  if (error) return jsonError(safeMessage(error), 500);
  return NextResponse.json({ blocked_slot: data });
}
