"use client";
import { useCallback, useEffect, useState } from "react";
import { useAdminData, invalidateAdminCache } from "@/components/admin/use-admin-data";
import { PrescriptionComposer } from "@/components/admin/PrescriptionComposer";

type BookingRow = {
  id: string;
  reference_code: string;
  category_name: string;
  category_id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  payment_status: string;
  price_final: number;
  document_count: number;
};

type BookingDetail = BookingRow & {
  reason: string;
  doctor_notes: string;
  meet_link: string | null;
  documents: { id: string; file_name: string; file_type: string; url: string | null; uploaded_by: string }[];
};

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-ok/10 text-ok",
  pending_payment: "bg-warn/10 text-warn",
  completed: "bg-black/5 text-muted",
  cancelled: "bg-danger/10 text-danger",
  rescheduled: "bg-gold/20 text-[#8A6A34]",
  no_show: "bg-black/5 text-muted",
};

export default function AdminBookingsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* Debounce the QUERY, not the request — see the note in the patients page.
     The old code put a flat 250ms in front of every mount. */
  useEffect(() => {
    if (q === debouncedQ) return;
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q, debouncedQ]);

  const qs = new URLSearchParams();
  if (statusFilter) qs.set("status", statusFilter);
  if (debouncedQ) qs.set("q", debouncedQ);
  const url = `/api/admin/bookings?${qs.toString()}`;

  const { data, loading, error, refresh } = useAdminData<{ bookings: BookingRow[] }>(url);
  const rows = data?.bookings ?? [];

  /* After a booking changes, the cached list is stale — drop every cached
     bookings query, not just this one, because a status change can move a row
     between filters. */
  const load = useCallback(() => {
    invalidateAdminCache("/api/admin/bookings");
    refresh();
  }, [refresh]);

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-plum-deep">Bookings</h1>
          <p className="text-sm text-muted mt-1">All consultations, past and upcoming.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone, reference…"
            className="px-3.5 py-2 rounded-full border border-black/10 bg-white text-sm outline-none focus:border-plum w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-full border border-black/10 bg-white text-sm outline-none focus:border-plum"
          >
            <option value="">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending_payment">Pending payment</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rescheduled">Rescheduled</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-[#9B2C2C] bg-danger/10 rounded-xl px-4 py-3 mb-4">{error}</p>
      )}

      <div className="a-card rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted border-b border-black/5">
                {/* Headers name the thing in the cell. "When" was ambiguous —
                    it could have meant the appointment or when the booking was
                    made, and those are different dates. "Ref" and "Amount"
                    were the same kind of shorthand. */}
                <th className="px-4 py-3 font-semibold">Patient</th>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">Appointment date &amp; time</th>
                <th className="px-4 py-3 font-semibold">Booking status</th>
                <th className="px-4 py-3 font-semibold">Amount paid</th>
                <th className="px-4 py-3 font-semibold">Booking ref.</th>
              </tr>
            </thead>
            <tbody>
              {/* Skeleton rows while the first page loads. The table used to
                  render an empty tbody, so the card collapsed to its header
                  and then jumped back open when the data landed. */}
              {loading &&
                rows.length === 0 &&
                [0, 1, 2, 3, 4].map((i) => (
                  <tr key={`sk${i}`} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3"><div className="sk h-4 w-40 mb-1.5" /><div className="sk h-3 w-52" /></td>
                    <td className="px-4 py-3"><div className="sk h-4 w-28" /></td>
                    <td className="px-4 py-3"><div className="sk h-4 w-36" /></td>
                    <td className="px-4 py-3"><div className="sk h-5 w-20 rounded-full" /></td>
                    <td className="px-4 py-3"><div className="sk h-4 w-12" /></td>
                    <td className="px-4 py-3"><div className="sk h-4 w-24" /></td>
                  </tr>
                ))}

              {rows.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => setSelectedId(b.id)}
                  className="border-b border-black/5 last:border-0 hover:bg-blush-soft/40 cursor-pointer transition"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-plum-deep">{b.patient_name}</div>
                    <div className="text-xs text-muted">{b.patient_email}</div>
                  </td>
                  <td className="px-4 py-3 text-plum-mid">{b.category_name}</td>
                  <td className="px-4 py-3 text-plum-mid whitespace-nowrap">
                    {b.scheduled_date} · {b.scheduled_time.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_STYLES[b.status] || "bg-black/5"}`}>
                      {b.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-plum-deep font-medium">₹{b.price_final}</td>
                  <td className="px-4 py-3 text-xs text-muted-2 font-mono">{b.reference_code}</td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <p className="text-sm text-plum-deep font-medium">
                      {q || statusFilter ? "No bookings match this filter." : "No bookings yet."}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {q || statusFilter
                        ? "Try a different search term, or set the status back to All."
                        : "Consultations appear here as soon as patients start booking."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedId && (
        <BookingDetailPanel
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={() => {
            load();
          }}
        />
      )}
    </div>
  );
}

function BookingDetailPanel({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  /* Real free slots, so the doctor picks instead of typing a time that may not
     exist on the category's slot grid. */
  const [slotDays, setSlotDays] = useState<{ date: string; slots: { time: string }[] }[] | null>(null);
  const [rxBusy, setRxBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  /* The drawer stacked six unrelated things down one scroll: patient details,
     the whole prescription composer, the patient's note, uploaded reports,
     doctor's notes and five action buttons. Writing a prescription meant
     scrolling past everything else, and the destructive actions sat directly
     under the thing you were typing into. Two tabs separate "what happened"
     from "what I am writing"; the actions move into the Details tab where
     they belong. */
  const [tab, setTab] = useState<"details" | "prescription">("details");

  const load = useCallback(() => {
    fetch(`/api/admin/bookings/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setBooking(d.booking);
        setNotes(d.booking?.doctor_notes || "");
      });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveNotes() {
    setSaving(true);
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctor_notes: notes }),
    });
    setSaving(false);
    onChanged();
  }

  async function markStatus(status: string) {
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
    onChanged();
  }

  async function openReschedule() {
    setRescheduling(true);
    setActionMsg(null);
    setSlotDays(null);
    try {
      const r = await fetch(`/api/admin/bookings/${id}/reschedule`);
      const d = await r.json();
      if (!r.ok) { setActionMsg({ kind: "err", text: d.error || "Could not load free slots." }); return; }
      setSlotDays(d.days || []);
    } catch {
      setActionMsg({ kind: "err", text: "Could not load free slots." });
    }
  }

  async function doReschedule() {
    if (!newDate || !newTime) {
      setActionMsg({ kind: "err", text: "Pick a date and a time first." });
      return;
    }
    setRxBusy(true);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/bookings/${id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate, time: newTime }),
      });
      /* The response used to be thrown away entirely. A rejected reschedule —
         slot gone, time not on the grid, booking cancelled — closed the form
         and reloaded the unchanged booking, so it looked like the button
         simply did nothing. That silence WAS the reported bug. */
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionMsg({ kind: "err", text: data.error || `Could not reschedule (${res.status}).` });
        return;
      }
      setActionMsg({ kind: "ok", text: "Rescheduled. The patient has been emailed." });
      setRescheduling(false);
      setNewDate(""); setNewTime("");
      load();
      onChanged();
    } catch {
      setActionMsg({ kind: "err", text: "Could not reach the server." });
    } finally {
      setRxBusy(false);
    }
  }

  async function doCancel() {
    if (!confirm("Cancel this booking? The patient will be emailed.")) return;
    await fetch(`/api/admin/bookings/${id}/cancel`, { method: "POST" });
    load();
    onChanged();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
      <div className="absolute inset-0 bg-plum-deep/40 backdrop-blur-sm" onClick={onClose} />
      {/* max-w-2xl, not lg. The drawer now holds the prescription composer, and
          at 512px a three-column medicine row squeezed its fields until the
          placeholders truncated mid-word ("When (1-0-", "How long (7"). */}
      <div className="relative w-full max-w-2xl h-full bg-cream shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-cream/95 backdrop-blur border-b border-black/5 px-6 py-4 flex items-center justify-between">
          <h2 className="font-serif text-xl text-plum-deep">Booking detail</h2>
          <button onClick={onClose} className="text-muted hover:text-plum-deep text-xl leading-none">
            ×
          </button>
        </div>

        {!booking ? (
          <p className="p-6 text-sm text-muted">Loading…</p>
        ) : (
          <div className="p-6 space-y-6">
            <div>
              <div className="text-xs text-muted-2 font-mono mb-1">{booking.reference_code}</div>
              <div className="font-serif text-xl text-plum-deep">{booking.patient_name}</div>
              <div className="text-sm text-muted">
                {booking.patient_email} · +91 {booking.patient_phone}
              </div>
              <div className="text-sm text-plum-mid mt-2">
                {booking.category_name} · {booking.scheduled_date} · {booking.scheduled_time.slice(0, 5)} · {booking.duration_minutes} min
              </div>
              <div className="text-sm text-plum-mid mt-1">₹{booking.price_final} · {booking.payment_status}</div>
              {booking.meet_link && (
                <a href={booking.meet_link} target="_blank" className="text-sm text-plum underline mt-2 inline-block">
                  Open Google Meet link
                </a>
              )}
            </div>

            {/* The prescription sits directly under the patient's details and
                above the admin actions, because writing it is what the doctor
                opens this panel to do after a consultation. */}
            <div className="inline-flex gap-1 p-1 rounded-full bg-plum/[0.06]">
              {([["details", "Visit details"], ["prescription", "Prescription"]] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  aria-current={tab === k ? "true" : undefined}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    tab === k ? "bg-white text-plum-deep shadow-sm" : "text-muted hover:text-plum-deep"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "prescription" && (
              <PrescriptionComposer
                bookingId={booking.id}
                patientName={booking.patient_name}
                patientEmail={booking.patient_email || null}
              />
            )}

            <div hidden={tab !== "details"}>
              <h3 className="text-xs uppercase tracking-wide text-muted font-semibold mb-2">Patient's note</h3>
              <p className="text-sm text-plum-mid bg-white/70 rounded-xl p-3 border border-black/5 whitespace-pre-wrap">
                {booking.reason || "—"}
              </p>
            </div>

            <div hidden={tab !== "details"}>
              <h3 className="text-xs uppercase tracking-wide text-muted font-semibold mb-2">
                Reports &amp; images ({booking.documents.length})
              </h3>
              {booking.documents.length === 0 && <p className="text-sm text-muted">None uploaded.</p>}
              <div className="space-y-1.5">
                {booking.documents.map((d) => (
                  <a
                    key={d.id}
                    href={d.url || "#"}
                    target="_blank"
                    className="flex items-center justify-between text-sm bg-white/70 rounded-lg px-3 py-2 border border-black/5 hover:border-blush-deep"
                  >
                    <span className="text-plum-deep truncate">{d.file_name}</span>
                    <span className="text-xs text-muted-2 ml-2">{d.uploaded_by}</span>
                  </a>
                ))}
              </div>
            </div>

            <div hidden={tab !== "details"}>
              {/* Retitled: this is the note the PATIENT sees on their booking
                  card. Calling it "notes & prescription" beside an actual
                  prescription tab was two names for two different things. */}
              <h3 className="text-xs uppercase tracking-wide text-muted font-semibold mb-2">
                Consultation notes <span className="normal-case tracking-normal text-muted-2">(visible to the patient)</span>
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                className="w-full text-sm rounded-xl border border-black/10 p-3 outline-none focus:border-plum bg-white/80"
                placeholder="Visible to the patient on their booking card…"
              />
              <button
                onClick={saveNotes}
                disabled={saving}
                className="mt-2 px-4 py-2 rounded-full bg-plum text-white text-xs font-semibold hover:bg-plum-deep transition disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save notes"}
              </button>
            </div>

            <div hidden={tab !== "details"} className="border-t border-black/5 pt-5 space-y-3">
              <h3 className="text-xs uppercase tracking-wide text-muted font-semibold">Actions</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => (rescheduling ? setRescheduling(false) : openReschedule())}
                  className="px-3.5 py-2 rounded-full border border-black/10 text-xs font-semibold text-plum-mid hover:border-plum"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => markStatus("completed")}
                  className="px-3.5 py-2 rounded-full border border-black/10 text-xs font-semibold text-plum-mid hover:border-plum"
                >
                  Mark completed
                </button>
                <button onClick={doCancel} className="px-3.5 py-2 rounded-full border border-danger/30 text-xs font-semibold text-danger hover:bg-danger/5">
                  Cancel booking
                </button>
              </div>
              {rescheduling && (
                <div className="bg-white/70 border border-black/5 rounded-xl p-3.5 space-y-3">
                  {slotDays === null && !actionMsg && (
                    <div className="space-y-2"><div className="sk h-4 w-40" /><div className="sk h-[42px] w-full" /></div>
                  )}

                  {slotDays !== null && slotDays.length === 0 && (
                    <p className="text-xs text-muted">
                      No free slots in the next 45 days. Open Availability to add working hours or clear a block.
                    </p>
                  )}

                  {slotDays !== null && slotDays.length > 0 && (
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      <label className="block">
                        <span className="block text-[11px] font-semibold text-plum-deep mb-1">New date</span>
                        <select
                          className="input"
                          value={newDate}
                          onChange={(e) => { setNewDate(e.target.value); setNewTime(""); }}
                        >
                          <option value="">Choose a date…</option>
                          {slotDays.map((d) => (
                            <option key={d.date} value={d.date}>
                              {d.date} · {d.slots.length} free
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="block text-[11px] font-semibold text-plum-deep mb-1">New time</span>
                        <select
                          className="input"
                          value={newTime}
                          disabled={!newDate}
                          onChange={(e) => setNewTime(e.target.value)}
                        >
                          <option value="">{newDate ? "Choose a time…" : "Pick a date first"}</option>
                          {(slotDays.find((d) => d.date === newDate)?.slots || []).map((s) => (
                            <option key={s.time} value={s.time}>{s.time}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={doReschedule}
                      disabled={rxBusy || !newDate || !newTime}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-plum text-white text-xs font-semibold disabled:opacity-40"
                    >
                      {rxBusy && <span className="spin-sm" aria-hidden />}
                      {rxBusy ? "Rescheduling…" : "Confirm new time"}
                    </button>
                    <button
                      onClick={() => { setRescheduling(false); setActionMsg(null); }}
                      disabled={rxBusy}
                      className="px-3 py-2 rounded-full text-xs font-semibold text-muted hover:text-plum-deep"
                    >
                      Cancel
                    </button>
                    <p className="text-[11px] text-muted-2">Only genuinely free slots are listed.</p>
                  </div>
                </div>
              )}

              {actionMsg && (
                <p role="status" aria-live="polite"
                   className={`text-xs ${actionMsg.kind === "ok" ? "text-ok" : "text-[#9B2C2C]"}`}>
                  {actionMsg.text}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
