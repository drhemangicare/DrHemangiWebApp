import { NextRequest, NextResponse } from "next/server";
import { computeAvailability } from "@/lib/availability";
import { getPublicSettings } from "@/lib/site/settings";
import { jsonError, safeMessage } from "@/lib/http";

export async function GET(req: NextRequest) {
  /* The feature flag is enforced on the SERVER too, not just by hiding the UI.
     With online consultation off there is no legitimate caller for this
     endpoint — the wizard never mounts — so a request reaching it is a stale
     tab, a bookmarked form post or a script. Returning 403 keeps the flag from
     being a cosmetic setting that a curl command can walk straight around. */
  const { online_consultation_enabled } = await getPublicSettings();
  if (!online_consultation_enabled) {
    return NextResponse.json({ days: [] }, { status: 403 });
  }

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
