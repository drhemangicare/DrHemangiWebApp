"use client";
import { useEffect, useMemo, useState, useCallback } from "react";

type WorkingHour = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
};
type BlockedSlot = { id: string; block_date: string; whole_day: boolean; start_time: string | null; end_time: string | null; reason: string | null };

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// Clinics think in Mon–Sun, not the Sunday-first order the database stores.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "");

function prettyDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminAvailabilityPage() {
  const [hours, setHours] = useState<WorkingHour[]>([]);
  const [blocked, setBlocked] = useState<BlockedSlot[]>([]);
  const [newWindow, setNewWindow] = useState({ weekday: 1, start_time: "10:00", end_time: "14:00", slot_duration_minutes: 30 });
  const [newBlock, setNewBlock] = useState({ block_date: "", whole_day: true, start_time: "", end_time: "", reason: "" });

  const load = useCallback(() => {
    fetch("/api/admin/availability/working-hours")
      .then((r) => r.json())
      .then((d) => setHours(d.working_hours || []));
    fetch("/api/admin/availability/blocked-slots")
      .then((r) => r.json())
      .then((d) => setBlocked(d.blocked_slots || []));
  }, []);

  useEffect(load, [load]);

  // Group windows under one heading per day. The flat list repeated the day
  // name for every window ("Monday … / Monday …"), which is what made the
  // page feel like a data dump rather than a schedule.
  const byDay = useMemo(
    () =>
      WEEK_ORDER.map((weekday) => ({
        weekday,
        windows: hours
          .filter((h) => h.weekday === weekday)
          .sort((a, b) => a.start_time.localeCompare(b.start_time)),
      })).filter((d) => d.windows.length > 0),
    [hours]
  );

  const sortedBlocks = useMemo(() => [...blocked].sort((a, b) => a.block_date.localeCompare(b.block_date)), [blocked]);

  async function addWindow() {
    await fetch("/api/admin/availability/working-hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newWindow),
    });
    load();
  }
  async function removeWindow(id: string) {
    await fetch(`/api/admin/availability/working-hours/${id}`, { method: "DELETE" });
    load();
  }
  async function addBlock() {
    if (!newBlock.block_date) return;
    await fetch("/api/admin/availability/blocked-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBlock),
    });
    setNewBlock({ block_date: "", whole_day: true, start_time: "", end_time: "", reason: "" });
    load();
  }
  async function removeBlock(id: string) {
    await fetch(`/api/admin/availability/blocked-slots/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-3xl space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-plum-deep">Availability</h1>
        <p className="text-sm text-muted mt-1">Weekly consulting hours, plus one-off blocked dates (leave, holidays).</p>
      </div>

      {/* ── Weekly hours ── */}
      <section className="bg-white/80 border border-black/5 rounded-2xl p-4 sm:p-5 shadow-sm">
        <h2 className="font-serif text-lg text-plum-deep">Weekly hours</h2>
        <p className="text-xs text-muted mt-0.5 mb-4">These repeat every week. Patients only see slots inside these windows.</p>

        {byDay.length === 0 ? (
          <p className="text-sm text-muted bg-cream rounded-xl px-4 py-3">
            No working hours set — patients won&apos;t see any slots.
          </p>
        ) : (
          <div className="space-y-2.5">
            {byDay.map(({ weekday, windows }) => (
              <div key={weekday} className="bg-cream rounded-xl p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-plum-mid mb-2 px-1">
                  {WEEKDAYS[weekday]}
                </div>
                <div className="space-y-1.5">
                  {windows.map((h) => (
                    <div key={h.id} className="flex items-center gap-2 bg-white rounded-lg pl-3 pr-2 py-2">
                      <span className="text-sm font-medium text-plum-deep tabular-nums whitespace-nowrap">
                        {hhmm(h.start_time)} – {hhmm(h.end_time)}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blush-soft text-plum-mid whitespace-nowrap">
                        {h.slot_duration_minutes} min
                      </span>
                      <button
                        onClick={() => removeWindow(h.id)}
                        aria-label={`Remove ${WEEKDAYS[weekday]} ${hhmm(h.start_time)}–${hhmm(h.end_time)}`}
                        className="ml-auto shrink-0 text-xs font-semibold text-danger px-2.5 py-1.5 rounded-lg hover:bg-danger/10 transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-black/5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-plum-mid mb-2.5">Add a window</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <label className="block col-span-2 sm:col-span-1">
              <span className="block text-xs font-semibold text-plum-mid mb-1">Day</span>
              <select
                className="input"
                value={newWindow.weekday}
                onChange={(e) => setNewWindow({ ...newWindow, weekday: Number(e.target.value) })}
              >
                {WEEK_ORDER.map((i) => (
                  <option key={i} value={i}>
                    {WEEKDAYS[i]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-plum-mid mb-1">Start</span>
              <input type="time" className="input" value={newWindow.start_time} onChange={(e) => setNewWindow({ ...newWindow, start_time: e.target.value })} />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-plum-mid mb-1">End</span>
              <input type="time" className="input" value={newWindow.end_time} onChange={(e) => setNewWindow({ ...newWindow, end_time: e.target.value })} />
            </label>
            <label className="block col-span-2 sm:col-span-1">
              <span className="block text-xs font-semibold text-plum-mid mb-1">Slot length</span>
              <select
                className="input"
                value={newWindow.slot_duration_minutes}
                onChange={(e) => setNewWindow({ ...newWindow, slot_duration_minutes: Number(e.target.value) })}
              >
                {[15, 20, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            onClick={addWindow}
            className="mt-3 w-full sm:w-auto px-5 py-2.5 rounded-full bg-plum text-white text-sm font-semibold hover:bg-plum-deep transition"
          >
            Add window
          </button>
        </div>
      </section>

      {/* ── Blocked dates ── */}
      <section className="bg-white/80 border border-black/5 rounded-2xl p-4 sm:p-5 shadow-sm">
        <h2 className="font-serif text-lg text-plum-deep">Blocked dates</h2>
        <p className="text-xs text-muted mt-0.5 mb-4">One-off days off. These override the weekly hours above.</p>

        {sortedBlocks.length === 0 ? (
          <p className="text-sm text-muted bg-cream rounded-xl px-4 py-3">No blocked dates set.</p>
        ) : (
          <div className="space-y-2">
            {sortedBlocks.map((b) => (
              <div key={b.id} className="flex items-start gap-2 bg-cream rounded-xl pl-4 pr-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-plum-deep whitespace-nowrap">{prettyDate(b.block_date)}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blush-soft text-plum-mid whitespace-nowrap">
                      {b.whole_day ? "Whole day" : `${hhmm(b.start_time)} – ${hhmm(b.end_time)}`}
                    </span>
                  </div>
                  {b.reason && <p className="text-xs text-muted mt-1 break-words">{b.reason}</p>}
                </div>
                <button
                  onClick={() => removeBlock(b.id)}
                  aria-label={`Remove blocked date ${prettyDate(b.block_date)}`}
                  className="shrink-0 text-xs font-semibold text-danger px-2.5 py-1.5 rounded-lg hover:bg-danger/10 transition"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-black/5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-plum-mid mb-2.5">Block a date</div>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="block col-span-2 sm:col-span-1">
              <span className="block text-xs font-semibold text-plum-mid mb-1">Date</span>
              <input type="date" className="input" value={newBlock.block_date} onChange={(e) => setNewBlock({ ...newBlock, block_date: e.target.value })} />
            </label>
            <label className="col-span-2 sm:col-span-1 flex items-center gap-2 text-sm text-plum-mid sm:mt-[22px] cursor-pointer">
              <input
                type="checkbox"
                className="admin-check"
                checked={newBlock.whole_day}
                onChange={(e) => setNewBlock({ ...newBlock, whole_day: e.target.checked })}
              />
              Whole day
            </label>
            {!newBlock.whole_day && (
              <>
                <label className="block">
                  <span className="block text-xs font-semibold text-plum-mid mb-1">From</span>
                  <input type="time" className="input" value={newBlock.start_time} onChange={(e) => setNewBlock({ ...newBlock, start_time: e.target.value })} />
                </label>
                <label className="block">
                  <span className="block text-xs font-semibold text-plum-mid mb-1">To</span>
                  <input type="time" className="input" value={newBlock.end_time} onChange={(e) => setNewBlock({ ...newBlock, end_time: e.target.value })} />
                </label>
              </>
            )}
            <label className="block col-span-2">
              <span className="block text-xs font-semibold text-plum-mid mb-1">
                Reason <span className="font-normal text-muted-2">(optional)</span>
              </span>
              <input className="input" value={newBlock.reason} onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })} placeholder="Leave" />
            </label>
          </div>
          <button
            onClick={addBlock}
            disabled={!newBlock.block_date}
            className="mt-3 w-full sm:w-auto px-5 py-2.5 rounded-full bg-plum text-white text-sm font-semibold hover:bg-plum-deep transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Block date
          </button>
        </div>
      </section>
    </div>
  );
}
