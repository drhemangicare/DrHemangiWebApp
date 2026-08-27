"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "./Toast";
import { MONTHS, fmt12, fmtDate, dateFromIso, type Day } from "@/lib/site/format";

type Doc = { id: string; file_name: string };
type Booking = {
  id: string;
  category_id: string;
  category_name: string;
  reference_code: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  payment_status: string;
  price_final: number;
  meet_link: string | null;
  doctor_notes: string | null;
  documents?: Doc[];
};

const MAX_FILE_MB = 15;

export function BookingsManager() {
  const [stage, setStage] = useState<"email" | "otp" | "list">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<"up" | "past">("up");

  const [resc, setResc] = useState<Booking | null>(null);
  const [docs, setDocs] = useState<Booking | null>(null);

  /* ── lookup ───────────────────────────────────────────────────────────── */
  async function sendCode() {
    const e = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return toast("Enter a valid email address");
    setBusy(true);
    try {
      const r = await fetch("/api/bookings/lookup", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "Could not send code");
      }
      setStage("otp");
      toast("Code sent — check your inbox");
    } catch (err: any) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!/^\d{6}$/.test(otp.trim())) return toast("Enter the 6-digit code");
    setBusy(true);
    try {
      const r = await fetch("/api/bookings/lookup/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Invalid or expired code");
      setToken(data.token);
      setBookings(data.bookings || []);
      setStage("list");
      toast("Verified · welcome back");
    } catch (err: any) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  const refresh = useCallback(async () => {
    if (!email || !token) return;
    try {
      const r = await fetch("/api/bookings/lookup/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), token }),
      });
      const d = await r.json();
      if (r.ok && d.bookings) setBookings(d.bookings);
    } catch { /* keep the current list on a transient failure */ }
  }, [email, token]);

  function signOut() {
    setStage("email"); setOtp(""); setToken(""); setBookings([]);
  }

  /* ── actions ──────────────────────────────────────────────────────────── */
  async function cancel(b: Booking) {
    if (!confirm("Cancel this consultation? This cannot be undone.")) return;
    try {
      const r = await fetch(`/api/bookings/${b.id}/cancel`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not cancel");
      toast("Consultation cancelled");
      refresh();
    } catch (err: any) { toast(err.message); }
  }

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => b.status !== "cancelled" && b.status !== "completed" && new Date(b.scheduled_date + "T" + b.scheduled_time) >= now
  );
  const past = bookings.filter((b) => !upcoming.includes(b));
  const shown = tab === "up" ? upcoming : past;

  return (
    <section className="mb">
      <div className="wrap-n">
        {stage !== "list" ? (
          <div className="lookup">
            <span className="eyebrow c">My bookings</span>
            <h2 style={{ margin: "14px 0 12px" }}>No login. Just your email.</h2>
            <p className="lede">
              Enter the email you booked with — we&apos;ll send a one-time code to verify it&apos;s you, then show your
              consultations.
            </p>
            <div className="bk-card">
              {stage === "email" ? (
                <>
                  <div className="fld">
                    <label htmlFor="lk-email">Email address</label>
                    <input id="lk-email" type="email" autoComplete="email" placeholder="you@email.com"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") sendCode(); }} />
                    <span className="hint">The email you used when booking</span>
                  </div>
                  <button className="btn btn-p btn-block btn-lg" style={{ marginTop: 18 }} disabled={busy} onClick={sendCode}>
                    {busy ? "Sending…" : <>Send me a code <svg><use href="#i-arr" /></svg></>}
                  </button>
                  <div className="secure" style={{ color: "var(--muted)", marginTop: 16 }}>
                    <svg style={{ color: "var(--gold)" }}><use href="#i-lock" /></svg>
                    A one-time code is emailed to protect your records
                  </div>
                </>
              ) : (
                <>
                  <div className="fld">
                    <label htmlFor="lk-otp">6-digit code</label>
                    <input id="lk-otp" inputMode="numeric" maxLength={6} placeholder="••••••" autoComplete="one-time-code"
                      value={otp} onChange={(e) => setOtp(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") verify(); }} />
                    <span className="hint">Sent to <b>{email}</b> · valid for 10 minutes</span>
                  </div>
                  <button className="btn btn-p btn-block btn-lg" style={{ marginTop: 18 }} disabled={busy} onClick={verify}>
                    {busy ? "Checking…" : <>Verify &amp; show bookings <svg><use href="#i-arr" /></svg></>}
                  </button>
                  <button className="btn btn-g btn-block" style={{ marginTop: 10 }} disabled={busy} onClick={sendCode}>
                    Resend code
                  </button>
                </>
              )}
            </div>
            <p style={{ fontSize: ".85rem", color: "var(--muted)", marginTop: 22 }}>
              Haven&apos;t booked yet?{" "}
              <Link href="/book" style={{ color: "var(--plum)", fontWeight: 600, textDecoration: "underline" }}>
                Book a consultation
              </Link>
            </p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 30 }}>
              <span className="eyebrow c">Welcome back</span>
              <h2 style={{ margin: "14px 0 10px" }}>Your consultations</h2>
              <p className="lede">Showing bookings for {email}</p>
            </div>

            <div className="tabs">
              <button className={tab === "up" ? "on" : undefined} onClick={() => setTab("up")}>Upcoming</button>
              <button className={tab === "past" ? "on" : undefined} onClick={() => setTab("past")}>Past</button>
            </div>

            <div className="bkg-list">
              {shown.length === 0 && (
                <div className="empty card">
                  <svg><use href="#i-inbox" /></svg>
                  <b>No {tab === "up" ? "upcoming" : "past"} consultations</b>
                  <p>{tab === "up" ? "You don't have anything booked right now." : "Your consultation history will appear here."}</p>
                  {tab === "up" && <Link className="btn btn-p" href="/book">Book a consultation</Link>}
                </div>
              )}
              {shown.map((b) => {
                const d = dateFromIso(b.scheduled_date);
                const isPast = tab === "past";
                return (
                  <div className="bkg" key={b.id}>
                    <div className="bkg-top">
                      <div className="bkg-date">
                        <div className="m">{MONTHS[d.getMonth()]}</div>
                        <div className="d">{d.getDate()}</div>
                        <div className="y">{d.getFullYear()}</div>
                      </div>
                      <div className="bkg-main">
                        <b>{b.category_name}</b>
                        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                          <span className="pill">Video consultation</span>
                          {b.status === "cancelled" ? <span className="pill">Cancelled</span>
                            : isPast ? <span className="pill">Completed</span>
                            : <span className="pill ok">Confirmed</span>}
                          <span className="pill gold">{b.reference_code}</span>
                        </div>
                        <div className="bkg-meta">
                          <i><svg><use href="#i-clock" /></svg>{fmt12(b.scheduled_time.slice(0, 5))} IST · {b.duration_minutes} min</i>
                          <i><svg><use href="#i-heart" /></svg>Dr Hemangi</i>
                          <i><svg><use href="#i-check" /></svg>₹{b.price_final} {b.payment_status === "paid" ? "paid" : b.payment_status}</i>
                        </div>
                      </div>
                    </div>

                    {b.doctor_notes && (
                      <div className="bkg-note">
                        <b>Doctor&apos;s notes &amp; prescription</b>
                        <p>{b.doctor_notes}</p>
                      </div>
                    )}
                    {b.documents && b.documents.length > 0 && (
                      <div className="bkg-note" style={{ background: "rgba(74,31,53,.05)", borderLeftColor: "var(--plum-mid)" }}>
                        <b>Your reports on file</b>
                        <p>{b.documents.map((x) => x.file_name).join(", ")}</p>
                      </div>
                    )}

                    <div className="bkg-act">
                      {!isPast && b.status !== "cancelled" && b.meet_link && (
                        <a className="btn btn-p btn-sm" href={b.meet_link} target="_blank" rel="noopener noreferrer">
                          <svg><use href="#i-video" /></svg> Join Google Meet
                        </a>
                      )}
                      {!isPast && b.status !== "cancelled" ? (
                        <>
                          <button className="btn btn-g btn-sm" onClick={() => setResc(b)}>
                            <svg><use href="#i-cal" /></svg> Reschedule
                          </button>
                          <button className="btn btn-g btn-sm" onClick={() => cancel(b)}>Cancel</button>
                          <button className="btn btn-g btn-sm" onClick={() => setDocs(b)}>
                            <svg><use href="#i-up" /></svg> Add reports
                          </button>
                        </>
                      ) : (
                        <Link className="btn btn-g btn-sm" href="/book">Book follow-up</Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: "center", marginTop: 34, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link className="btn btn-p" href="/book">Book another consultation <svg><use href="#i-arr" /></svg></Link>
              <button className="btn btn-g" onClick={signOut}>Use a different email</button>
            </div>
          </>
        )}
      </div>

      {resc && <RescheduleDialog booking={resc} token={token} onClose={() => setResc(null)} onDone={() => { setResc(null); refresh(); }} />}
      {docs && <DocsDialog booking={docs} token={token} onClose={() => { setDocs(null); refresh(); }} />}
    </section>
  );
}

/* ── reschedule ──────────────────────────────────────────────────────────── */

function RescheduleDialog({ booking, token, onClose, onDone }: {
  booking: Booking; token: string; onClose: () => void; onDone: () => void;
}) {
  const [days, setDays] = useState<Day[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/availability?category_id=${encodeURIComponent(booking.category_id)}`)
      .then((r) => r.json())
      .then((d) => setDays(d.days || []))
      .catch(() => toast("Could not load availability"))
      .finally(() => setLoading(false));
  }, [booking.category_id]);

  async function confirm() {
    if (!date || !slot) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/bookings/${booking.id}/reschedule`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time: slot, token }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not reschedule");
      toast("Rescheduled — a new confirmation has been emailed");
      onDone();
    } catch (err: any) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  const day = days.find((d) => d.date === date);

  return (
    <div className="ovl on" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rzp" style={{ width: "min(480px,100%)", textAlign: "left" }}>
        <div className="rzp-h">
          <div>
            <b>Reschedule consultation</b>
            <div style={{ fontSize: ".72rem", opacity: 0.65 }}>
              Currently {fmtDate(dateFromIso(booking.scheduled_date))} · {fmt12(booking.scheduled_time.slice(0, 5))}
            </div>
          </div>
          <button className="btn btn-g btn-sm" style={{ background: "rgba(255,255,255,.14)", color: "#fff" }} onClick={onClose}>
            Close
          </button>
        </div>
        <div className="rzp-b">
          <div className="date-rail">
            {loading && <span style={{ fontSize: ".85rem", color: "var(--muted)" }}>Loading availability…</span>}
            {days.map((o) => {
              const d = dateFromIso(o.date);
              return (
                <button key={o.date} className={`dte${o.offDay ? " off" : ""}${date === o.date ? " sel" : ""}`}
                  onClick={() => { setDate(o.date); setSlot(null); }}>
                  <span className="d">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()]}</span>
                  <span className="n">{d.getDate()}</span>
                  <span className="m">{MONTHS[d.getMonth()]}</span>
                </button>
              );
            })}
          </div>
          {day && (
            <div className="slots" style={{ marginTop: 14 }}>
              {day.slots.map((s) => (
                <button key={s.time} className={`slot${!s.available ? " off" : ""}${slot === s.time ? " sel" : ""}`}
                  onClick={() => setSlot(s.time)}>
                  {fmt12(s.time)}
                </button>
              ))}
            </div>
          )}
          <button className="btn btn-p btn-block" style={{ marginTop: 18 }} disabled={!date || !slot || busy} onClick={confirm}>
            {busy ? "Rescheduling…" : "Confirm new time"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── add reports ─────────────────────────────────────────────────────────── */

function DocsDialog({ booking, token, onClose }: { booking: Booking; token: string; onClose: () => void }) {
  const [rows, setRows] = useState<{ name: string; state: string }[]>([]);
  const input = useState<HTMLInputElement | null>(null);
  const [el, setEl] = useState<HTMLInputElement | null>(null);
  void input;

  async function upload(f: File) {
    if (f.size > MAX_FILE_MB * 1024 * 1024) return toast(`${f.name} is over ${MAX_FILE_MB} MB`);
    setRows((r) => [...r, { name: f.name, state: "uploading…" }]);
    try {
      const fd = new FormData();
      fd.append("files", f);
      fd.append("token", token);
      const r = await fetch(`/api/bookings/${booking.id}/documents`, { method: "POST", body: fd });
      if (!r.ok) throw new Error();
      setRows((cur) => cur.map((x) => (x.name === f.name ? { ...x, state: "uploaded ✓" } : x)));
    } catch {
      setRows((cur) => cur.map((x) => (x.name === f.name ? { ...x, state: "failed" } : x)));
      toast(`Could not upload ${f.name}`);
    }
  }

  return (
    <div className="ovl on" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rzp" style={{ width: "min(480px,100%)", textAlign: "left" }}>
        <div className="rzp-h">
          <div>
            <b>Add reports</b>
            <div style={{ fontSize: ".72rem", opacity: 0.65 }}>PDF, JPG or PNG · up to {MAX_FILE_MB} MB each</div>
          </div>
          <button className="btn btn-g btn-sm" style={{ background: "rgba(255,255,255,.14)", color: "#fff" }} onClick={onClose}>
            Close
          </button>
        </div>
        <div className="rzp-b">
          <div className="upload" role="button" tabIndex={0}
            onClick={() => el?.click()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") el?.click(); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); Array.from(e.dataTransfer.files).forEach(upload); }}>
            <svg><use href="#i-up" /></svg>
            <b>Tap to upload or drag files here</b>
            <span>PDF, JPG or PNG · up to {MAX_FILE_MB} MB each</span>
          </div>
          <input ref={setEl} type="file" multiple hidden accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => { Array.from(e.target.files || []).forEach(upload); e.target.value = ""; }} />
          <div className="up-list">
            {rows.map((r, i) => (
              <div className="up-item" key={r.name + i}>
                <svg><use href="#i-doc" /></svg>
                {r.name}
                <span style={{ marginLeft: "auto", color: "var(--muted-2)", fontSize: ".75rem" }}>{r.state}</span>
              </div>
            ))}
          </div>
          {booking.documents && booking.documents.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div className="hint" style={{ marginBottom: 8 }}>Already on file:</div>
              {booking.documents.map((d) => (
                <div className="up-item" key={d.id}>
                  <svg><use href="#i-doc" /></svg>
                  {d.file_name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
