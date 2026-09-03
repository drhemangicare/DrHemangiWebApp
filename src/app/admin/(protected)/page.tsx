"use client";
import { useMemo, useState } from "react";
import { StatTile } from "@/components/admin/stat-tile";
import { useAdminData } from "@/components/admin/use-admin-data";

type Analytics = {
  total_revenue: number;
  total_bookings: number;
  total_discount_given: number;
  average_booking_value: number;
  by_category: { category_id: string; category_name: string; revenue: number; bookings: number }[];
  by_day: { date: string; revenue: number }[];
  status_breakdown: Record<string, number>;
};

const RANGE_OPTIONS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

export default function AdminOverviewPage() {
  const [rangeDays, setRangeDays] = useState(30);

  /* Through the shared cache, so coming back to Overview paints the numbers
     that were on screen last time and refreshes them behind you, instead of
     wiping to skeletons and re-fetching from blank. Switching 7/30/90 days is
     the same: a range you have already looked at comes back instantly. */
  const url = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - rangeDays);
    const qs = new URLSearchParams({
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    });
    return `/api/admin/analytics?${qs.toString()}`;
  }, [rangeDays]);

  const { data, loading } = useAdminData<Analytics>(url);

  const maxCategoryRevenue = Math.max(1, ...(data?.by_category.map((c) => c.revenue) || [1]));
  const maxDayRevenue = Math.max(1, ...(data?.by_day.map((d) => d.revenue) || [1]));

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-plum-deep">Overview</h1>
          <p className="text-sm text-muted mt-1">Revenue and bookings, by consultation category.</p>
        </div>
        <div className="flex gap-1.5 p-1 rounded-full bg-black/5">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setRangeDays(opt.days)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                rangeDays === opt.days ? "bg-white text-plum-deep shadow-sm" : "text-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatTile label="Revenue earned" value={`₹${(data?.total_revenue ?? 0).toLocaleString("en-IN")}`} sub={`${rangeDays}-day window`} />
            <StatTile label="Paid consultations" value={String(data?.total_bookings ?? 0)} />
            <StatTile label="Average booking value" value={`₹${(data?.average_booking_value ?? 0).toLocaleString("en-IN")}`} />
            <StatTile label="Discounts given" value={`₹${(data?.total_discount_given ?? 0).toLocaleString("en-IN")}`} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="a-card rounded-2xl p-6 shadow-sm">
              <h2 className="font-serif text-lg text-plum-deep mb-1">Revenue by category</h2>
              <p className="text-xs text-muted mb-5">Where the clinic's income is coming from.</p>
              <div className="space-y-3.5">
                {(data?.by_category ?? []).length === 0 && <p className="text-sm text-muted">No paid bookings in this window yet.</p>}
                {(data?.by_category ?? []).map((c) => (
                  <div key={c.category_id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-plum-mid font-medium">{c.category_name}</span>
                      <span className="text-plum-deep font-semibold">
                        ₹{c.revenue.toLocaleString("en-IN")} <span className="text-muted-2 font-normal">· {c.bookings}</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-black/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-plum"
                        style={{ width: `${Math.max(4, (c.revenue / maxCategoryRevenue) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="a-card rounded-2xl p-6 shadow-sm">
              <h2 className="font-serif text-lg text-plum-deep mb-1">Daily revenue</h2>
              <p className="text-xs text-muted mb-5">Money earned per day, this window.</p>
              <div className="flex items-end gap-1 h-40">
                {(data?.by_day ?? []).length === 0 && <p className="text-sm text-muted">No revenue yet.</p>}
                {(data?.by_day ?? []).map((d) => (
                  <div key={d.date} className="flex-1 group relative flex flex-col items-center justify-end h-full">
                    <div
                      className="w-full rounded-t bg-gold min-h-[3px]"
                      style={{ height: `${Math.max(2, (d.revenue / maxDayRevenue) * 100)}%` }}
                      title={`${d.date}: ₹${d.revenue}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="a-card rounded-2xl p-6 shadow-sm mt-6">
            <h2 className="font-serif text-lg text-plum-deep mb-4">Booking status</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(data?.status_breakdown ?? {}).map(([status, count]) => (
                <span key={status} className="text-xs px-3 py-1.5 rounded-full bg-blush-soft text-plum-mid font-medium capitalize">
                  {status.replace("_", " ")} · {count}
                </span>
              ))}
              {Object.keys(data?.status_breakdown ?? {}).length === 0 && <p className="text-sm text-muted">No bookings in this window.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
