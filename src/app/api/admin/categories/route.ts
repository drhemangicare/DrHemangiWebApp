import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { jsonError, safeMessage } from "@/lib/http";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const { data, error } = await supabaseAdmin().from("categories").select("*").order("sort_order", { ascending: true });
  if (error) return jsonError(safeMessage(error), 500);
  return NextResponse.json({ categories: data });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const body = await req.json().catch(() => ({}));
  const { slug, name, description, icon, price, duration_minutes, sort_order, existing_patients_only } = body;
  if (!slug || !name || price == null || !duration_minutes) {
    return jsonError("slug, name, price and duration_minutes are required");
  }
  const { data, error } = await supabaseAdmin()
    .from("categories")
    .insert({
      slug,
      name,
      description: description || "",
      icon: icon || "stethoscope",
      price,
      duration_minutes,
      sort_order: sort_order ?? 0,
      existing_patients_only: !!existing_patients_only,
    })
    .select()
    .single();
  if (error) return jsonError(safeMessage(error), 500);
  return NextResponse.json({ category: data });
}
