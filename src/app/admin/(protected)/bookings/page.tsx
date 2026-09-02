"use client";
import { useEffect, useState, useCallback } from "react";

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
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (statusFilter) qs.set("status", statusFilter);
    if (q) qs.set("q", q);
    fetch(`/api/admin/bookings?${qs.toString()}`)
      .then((r) => r.json())
      .then((d) => setRows(d.bookings || []))
      .finally(() => setLoading(false));
  }, [statusFilter, q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

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

      <div className="bg-white/80 border border-black/5 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted border-b border-black/5">
                <th className="px-4 py-3 font-semibold">Patient</th>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Ref</th>
              </tr>
            </thead>
            <tbody>
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
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                    No bookings match this filter.
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

  async function doReschedule() {
    if (!newDate || !newTime) return;
    await fetch(`/api/admin/bookings/${id}/reschedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate, time: newTime }),
    });
    setRescheduling(false);
    load();
    onChanged();
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
      <div className="relative w-full max-w-lg h-full bg-cream shadow-2xl overflow-y-auto">
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

            <div>
              <h3 className="text-xs uppercase tracking-wide text-muted font-semibold mb-2">Patient's note</h3>
              <p className="text-sm text-plum-mid bg-white/70 rounded-xl p-3 border border-black/5 whitespace-pre-wrap">
                {booking.reason || "—"}
              </p>
            </div>

            <div>
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

            <div>
              <h3 className="text-xs uppercase tracking-wide text-muted font-semibold mb-2">Doctor's notes &amp; prescription</h3>
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

            <div className="border-t border-black/5 pt-5 space-y-3">
              <h3 className="text-xs uppercase tracking-wide text-muted font-semibold">Actions</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setRescheduling((v) => !v)}
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
                <div className="flex flex-wrap gap-2 items-center bg-white/70 border border-black/5 rounded-xl p-3">
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="px-3 py-2 rounded-lg border border-black/10 text-sm" />
                  <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="px-3 py-2 rounded-lg border border-black/10 text-sm" />
                  <button onClick={doReschedule} className="px-3.5 py-2 rounded-full bg-plum text-white text-xs font-semibold">
                    Confirm
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
