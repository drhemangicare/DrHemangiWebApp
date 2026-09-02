import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { jsonError, safeMessage } from "@/lib/http";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const sp = req.nextUrl.searchParams;
  const from = sp.get("from") || defaultFrom();
  const to = sp.get("to") || todayStr();

  try {
    const sb = supabaseAdmin();

    const { data: paid, error: paidErr } = await sb
      .from("bookings")
      .select("id, category_id, price_final, discount_amount, created_at, categories(name)")
      .eq("payment_status", "paid")
      .gte("created_at", `${from}T00:00:00Z`)
      .lte("created_at", `${to}T23:59:59Z`);
    if (paidErr) throw paidErr;

    const { data: statusCounts, error: statusErr } = await sb
      .from("bookings")
      .select("status")
      .gte("created_at", `${from}T00:00:00Z`)
      .lte("created_at", `${to}T23:59:59Z`);
    if (statusErr) throw statusErr;

    const totalRevenue = (paid || []).reduce((sum, b) => sum + Number(b.price_final), 0);
    const totalBookings = (paid || []).length;
    const totalDiscountGiven = (paid || []).reduce((sum, b) => sum + Number(b.discount_amount || 0), 0);

    const byCategory = new Map<string, { category_id: string; category_name: string; revenue: number; bookings: number }>();
    for (const b of paid || []) {
      const key = b.category_id;
      const name = (b.categories as any)?.name || "Unknown";
      const existing = byCategory.get(key) || { category_id: key, category_name: name, revenue: 0, bookings: 0 };
      existing.revenue += Number(b.price_final);
      existing.bookings += 1;
      byCategory.set(key, existing);
    }

    const byDay = new Map<string, number>();
    for (const b of paid || []) {
      const day = String(b.created_at).slice(0, 10);
      byDay.set(day, (byDay.get(day) || 0) + Number(b.price_final));
    }

    const statusBreakdown: Record<string, number> = {};
    for (const row of statusCounts || []) {
      statusBreakdown[row.status] = (statusBreakdown[row.status] || 0) + 1;
    }

    return NextResponse.json({
      range: { from, to },
      total_revenue: round2(totalRevenue),
      total_bookings: totalBookings,
      total_discount_given: round2(totalDiscountGiven),
      average_booking_value: totalBookings ? round2(totalRevenue / totalBookings) : 0,
      by_category: Array.from(byCategory.values())
        .map((c) => ({ ...c, revenue: round2(c.revenue) }))
        .sort((a, b) => b.revenue - a.revenue),
      by_day: Array.from(byDay.entries())
        .map(([date, revenue]) => ({ date, revenue: round2(revenue) }))
        .sort((a, b) => (a.date < b.date ? -1 : 1)),
      status_breakdown: statusBreakdown,
    });
  } catch (err) {
    return jsonError(safeMessage(err), 500);
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}
