import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { applyDiscount, bestDiscountFor, discountLabel, loadLiveDiscounts } from "@/lib/pricing";
import { safeMessage } from "@/lib/http";

// Public: active consultation categories with live pricing (admin-set price
// minus whatever discount currently applies, if any).
export async function GET() {
  try {
    const sb = supabaseAdmin();
    const [{ data: categories, error }, discounts] = await Promise.all([
      sb.from("categories").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
      loadLiveDiscounts(),
    ]);
    if (error) throw error;

    const out = (categories || []).map((c) => {
      const d = bestDiscountFor(discounts, c.id);
      const { finalPrice, discountAmount } = applyDiscount(Number(c.price), d);
      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        icon: c.icon,
        price: Number(c.price),
        duration_minutes: c.duration_minutes,
        effective_price: finalPrice,
        discount_amount: discountAmount,
        discount_label: d ? discountLabel(d) : null,
        existing_patients_only: !!c.existing_patients_only,
      };
    });

    return NextResponse.json({ categories: out });
  } catch (err) {
    return NextResponse.json({ categories: [], error: safeMessage(err) }, { status: 200 });
  }
}
