import { supabaseAdmin } from "@/lib/supabase/server";

export type DaySlots = {
  date: string; // YYYY-MM-DD
  weekday: number;
  offDay: boolean;
  slots: { time: string; available: boolean }[];
};

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function toTimeStr(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const LEAD_TIME_MINUTES = 30; // don't let patients book a slot starting sooner than this
const PENDING_HOLD_MINUTES = 20; // an unpaid "pending_payment" booking releases its slot after this long

/**
 * Computes real availability for the next `days` days for one category:
 * admin's recurring working hours, minus blocked_slots (leave/holidays),
 * minus other active bookings (the doctor can only be in one consult at a
 * time, so bookings block the shared calendar regardless of category).
 */
export async function computeAvailability(categoryId: string, days = 21): Promise<DaySlots[]> {
  const sb = supabaseAdmin();

  const { data: category } = await sb
    .from("categories")
    .select("duration_minutes")
    .eq("id", categoryId)
    .maybeSingle();
  const duration = category?.duration_minutes ?? 30;

  const { data: hours } = await sb.from("working_hours").select("*").eq("is_active", true);

  const today = new Date();
  const startDate = new Date(today);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days + 1);

  const startStr = dateStr(startDate);
  const endStr = dateStr(endDate);

  const { data: blocked } = await sb
    .from("blocked_slots")
    .select("*")
    .gte("block_date", startStr)
    .lte("block_date", endStr);

  const cutoffIso = new Date(Date.now() - PENDING_HOLD_MINUTES * 60 * 1000).toISOString();
  const { data: bookingsRaw } = await sb
    .from("bookings")
    .select("scheduled_date, scheduled_time, duration_minutes, status, payment_status, created_at")
    .gte("scheduled_date", startStr)
    .lte("scheduled_date", endStr)
    .in("status", ["confirmed", "pending_payment", "rescheduled"]);

  const activeBookings = (bookingsRaw || []).filter(
    (b) => b.status !== "pending_payment" || b.created_at > cutoffIso
  );

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const todayStr = dateStr(now);

  const out: DaySlots[] = [];
  for (let i = 1; i <= days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const ds = dateStr(d);
    const weekday = d.getDay();
    const windows = (hours || []).filter((h) => h.weekday === weekday);
    const dayBlocked = (blocked || []).filter((b) => b.block_date === ds);
    const wholeDayOff = dayBlocked.some((b) => b.whole_day);

    const dayBookings = activeBookings
      .filter((b) => b.scheduled_date === ds)
      .map((b) => {
        const start = toMinutes(String(b.scheduled_time).slice(0, 5));
        return { start, end: start + b.duration_minutes };
      });
    const partialBlocks = dayBlocked
      .filter((b) => !b.whole_day && b.start_time && b.end_time)
      .map((b) => ({
        start: toMinutes(String(b.start_time).slice(0, 5)),
        end: toMinutes(String(b.end_time).slice(0, 5)),
      }));

    const slots: { time: string; available: boolean }[] = [];
    if (!wholeDayOff) {
      for (const w of windows) {
        const step = w.slot_duration_minutes || 30;
        const winEnd = toMinutes(String(w.end_time).slice(0, 5));
        let t = toMinutes(String(w.start_time).slice(0, 5));
        while (t + duration <= winEnd) {
          const slotEnd = t + duration;
          const overlapsBooking = dayBookings.some((b) => t < b.end && slotEnd > b.start);
          const overlapsBlock = partialBlocks.some((b) => t < b.end && slotEnd > b.start);
          const tooSoon = ds === todayStr && t <= nowMinutes + LEAD_TIME_MINUTES;
          slots.push({ time: toTimeStr(t), available: !overlapsBooking && !overlapsBlock && !tooSoon });
          t += step;
        }
      }
    }
    slots.sort((a, b) => (a.time < b.time ? -1 : 1));
    out.push({ date: ds, weekday, offDay: windows.length === 0 || wholeDayOff, slots });
  }
  return out;
}

export async function isSlotAvailable(categoryId: string, date: string, time: string): Promise<boolean> {
  const days = await computeAvailability(categoryId, 45);
  const day = days.find((d) => d.date === date);
  if (!day) return false;
  const slot = day.slots.find((s) => s.time === time);
  return !!slot && slot.available;
}
