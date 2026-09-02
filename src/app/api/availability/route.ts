import { NextRequest, NextResponse } from "next/server";
import { computeAvailability } from "@/lib/availability";
import { jsonError, safeMessage } from "@/lib/http";

export async function GET(req: NextRequest) {
  const categoryId = req.nextUrl.searchParams.get("category_id");
  if (!categoryId) return jsonError("category_id is required");
  const days = Math.min(45, Math.max(1, Number(req.nextUrl.searchParams.get("days") || 21)));
  try {
    const daySlots = await computeAvailability(categoryId, days);
    return NextResponse.json({ days: daySlots });
  } catch (err) {
    return NextResponse.json({ days: [], error: safeMessage(err) }, { status: 200 });
  }
}
