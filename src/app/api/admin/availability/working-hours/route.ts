import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { jsonError, safeMessage } from "@/lib/http";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { data, error } = await supabaseAdmin()
    .from("working_hours")
    .select("*")
    .order("weekday", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) return jsonError(safeMessage(error), 500);
  return NextResponse.json({ working_hours: data });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const body = await req.json().catch(() => ({}));
  const { weekday, start_time, end_time, slot_duration_minutes } = body;
  if (weekday == null || !start_time || !end_time) return jsonError("weekday, start_time and end_time are required");

  const { data, error } = await supabaseAdmin()
    .from("working_hours")
    .insert({ weekday, start_time, end_time, slot_duration_minutes: slot_duration_minutes || 30 })
    .select()
    .single();
  if (error) return jsonError(safeMessage(error), 500);
  return NextResponse.json({ working_hours: data });
}
