"use client";
import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "./Toast";
import { DAYS, MONTHS, fmt12, fmtDate, dateFromIso, type Category, type Day } from "@/lib/site/format";

type OrderResponse = {
  booking_id: string;
  reference_code: string;
  razorpay_order_id: string;
  key_id: string;
  price_original: number;
  discount_amount: number;
  price_final: number;
  category_name: string;
};

type Confirmation = {
  reference_code: string;
  scheduled_date: string;
  scheduled_time: string;
  price_final: number;
  meet_link: string | null;
};

const TITLES: [string, string][] = [
  ["Let's find you a time", "No account needed. Takes about two minutes."],
  ["Let's find you a time", "Tell us what this consultation is about."],
  ["Let's find you a time", "Choose a slot that works for you."],
  ["Almost there", "Your details stay private and are seen only by Dr Hemangi."],
  ["One last look", "Check everything, then pay securely."],
  ["Confirmed", ""],
];

const MAX_FILE_MB = 15;
const MAX_FILES = 8;

declare global {
  interface Window { Razorpay?: any }
}

type FormState = {
  name: string; age: string; phone: string; email: string;
  visit: string; note: string; consent: boolean;
};

export function BookingWizard({ clinicVisits = true }: { clinicVisits?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const preSelect = params.get("service");

  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [svc, setSvc] = useState<Category | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [done, setDone] = useState<Confirmation | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [razorpayReady, setRazorpayReady] = useState(false);

  // Plain state, not a ref: these values are read during render (the review
  // step and the confirmation ticket both display them), and reading a ref
  // during render is not safe under concurrent rendering.
  const [form, setForm] = useState<FormState>({
    name: "", age: "", phone: "", email: "", visit: "first", note: "", consent: false,
  });
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k as string] ? { ...e, [k as string]: false } : e));
  };
  const fileInput = useRef<HTMLInputElement>(null);

  /* ── data ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        const list: Category[] = d.categories || [];
        setCategories(list);
        if (preSelect) {
          const hit = list.find((c) => c.slug === preSelect || c.slug.includes(preSelect));
          if (hit) setSvc(hit);
        }
      })
      .catch(() => setCategories([]));
  }, [preSelect]);

  const loadAvailability = useCallback(async (category: Category) => {
    setLoadingSlots(true);
    setDays([]);
    try {
      const r = await fetch(`/api/availability?category_id=${encodeURIComponent(category.id)}`);
      const d = await r.json();
      setDays(d.days || []);
    } catch {
      toast("Could not load availability — please retry");
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  /* ── validation ───────────────────────────────────────────────────────── */
  function validate() {
    const f = form;
    const e: Record<string, boolean> = {
      name: f.name.trim().length < 2,
      age: !(Number(f.age) >= 10 && Number(f.age) <= 99),
      phone: !/^[6-9]\d{9}$/.test(f.phone.trim()),
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim()),
      note: f.note.trim().length < 5,
      consent: !f.consent,
    };
    setErrors(e);
    const ok = !Object.values(e).some(Boolean);
    if (!ok) toast("Please complete the highlighted fields");
    return ok;
  }

  /* ── step machine ─────────────────────────────────────────────────────── */
  async function next() {
    if (step === 0) { setStep(1); return; }
    if (step === 1) {
      if (!svc) return toast("Please select a service");
      await loadAvailability(svc);
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!date) return toast("Please pick a date");
      if (!slot) return toast("Please pick a time slot");
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!validate() || !svc) return;
      setProcessing("Reserving your slot…");
      try {
        const f = form;
        const res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category_id: svc.id, date, time: slot,
            patient: {
              name: f.name.trim(), age: Number(f.age), phone: f.phone.trim(),
              email: f.email.trim(), visit_type: f.visit, reason: f.note.trim(),
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "That slot was just taken — please pick another time");
        setOrder(data);
        if (files.length) {
          const fd = new FormData();
          files.forEach((x) => fd.append("files", x));
          await fetch(`/api/bookings/${data.booking_id}/documents`, { method: "POST", body: fd }).catch(() => {});
        }
        setProcessing(null);
        setStep(4);
      } catch (err: any) {
        setProcessing(null);
        toast(err.message);
        if (svc) await loadAvailability(svc);
        setStep(2);
      }
    }
  }

  /* ── payment ──────────────────────────────────────────────────────────── */
  function pay() {
    if (!order || !svc) return;
    if (!razorpayReady || !window.Razorpay) return toast("Payment is starting up — please try again in a moment");
    const f = form;
    const rzp = new window.Razorpay({
      key: order.key_id,
      amount: Math.round(order.price_final * 100),
      currency: "INR",
      name: "Dr Hemangi Clinic",
      description: svc.name,
      order_id: order.razorpay_order_id,
      prefill: { name: f.name.trim(), email: f.email.trim(), contact: "91" + f.phone.trim() },
      theme: { color: "#4A1F35" },
      handler: async (resp: any) => {
        setProcessing("Confirming your payment…");
        try {
          const r = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              booking_id: order.booking_id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            }),
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || "Payment verification failed");
          setProcessing(null);
          setDone(data);
          setStep(5);
          setTimeout(() => toast("Confirmation email sent"), 900);
        } catch {
          setProcessing(null);
          toast("We could not confirm your payment — please contact the clinic with reference " + order.reference_code);
        }
      },
      modal: { ondismiss: () => toast("Payment cancelled — your slot is held for a few more minutes") },
    });
    rzp.on("payment.failed", (resp: any) =>
      toast("Payment failed: " + (resp?.error?.description || "please try again"))
    );
    rzp.open();
  }

  /* ── file picking ─────────────────────────────────────────────────────── */
  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    setFiles((cur) => {
      const out = [...cur];
      for (const f of incoming) {
        if (out.length >= MAX_FILES) { toast(`You can attach up to ${MAX_FILES} files`); break; }
        if (f.size > MAX_FILE_MB * 1024 * 1024) { toast(`${f.name} is over ${MAX_FILE_MB} MB`); continue; }
        out.push(f);
      }
      return out;
    });
  }

  const fee = order?.price_final ?? svc?.effective_price ?? 0;
  const day = days.find((d) => d.date === date);
  const am = day?.slots.filter((s) => Number(s.time.split(":")[0]) < 15) ?? [];
  const pm = day?.slots.filter((s) => Number(s.time.split(":")[0]) >= 15) ?? [];

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setRazorpayReady(true)}
      />

      <section className="bk">
        <div className="wrap-n">
          {step !== 5 && (
            <div className="bk-head">
              <span className="eyebrow c">Book a consultation</span>
              <h2>{TITLES[step][0]}</h2>
              {TITLES[step][1] && <p className="lede">{TITLES[step][1]}</p>}
            </div>
          )}

          {step !== 5 && (
            <div className="rail" id="rail">
              <div className="rail-l"><i style={{ width: (step / 4) * 100 + "%" }} /></div>
              {["Consult type", "Service", "Date & time", "Your details", "Payment"].map((label, i) => (
                <div className={`rail-s${i === step ? " on" : ""}${i < step ? " done" : ""}`} key={label}>
                  <span className="rail-d">{i + 1}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="bk-card">
            {/* ── step 1: mode ── */}
            {step === 0 && (
              <div className="stepv on">
                <h3>Let&apos;s book your online consultation</h3>
                <p className="sub">Every booking here is a private video consultation with Dr Hemangi.</p>
                <div className="opts">
                  <button className="opt sel" type="button">
                    <div className="opt-ic"><svg><use href="#i-video" /></svg></div>
                    <b>Video consultation</b>
                    <p>
                      A private Google Meet call from wherever you are. Ideal for cycle issues, PCOS, report reviews,
                      fertility planning, pregnancy check-ins and follow-ups.
                    </p>
                    <div className="meta">
                      <span className="pill">20–45 min</span>
                      <span className="pill ok">From ₹400</span>
                      <span className="pill gold">Meet link emailed</span>
                    </div>
                  </button>
                  {/* Hidden when in-person visits are switched off in admin —
                      pointing a patient at clinic details that are themselves
                      hidden would be a dead end. */}
                  {clinicVisits && (
                    <div className="opt" style={{ cursor: "default", opacity: 0.85 }}>
                      <div className="opt-ic"><svg><use href="#i-clinic" /></svg></div>
                      <b>Prefer to visit in person?</b>
                      <p>
                        In-clinic visits aren&apos;t booked online. See the clinic&apos;s address, timings and map link
                        and reach out directly to arrange one.
                      </p>
                      <div className="meta">
                        <Link href="/contact" className="btn btn-g btn-sm">
                          View clinic details <svg><use href="#i-arr" /></svg>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                <div className="consent" style={{ marginTop: 20, background: "rgba(201,168,124,.14)", borderColor: "rgba(201,168,124,.4)" }}>
                  <svg style={{ width: 18, height: 18, color: "#8A6A34", flex: "none", marginTop: 2 }}><use href="#i-shield" /></svg>
                  <label style={{ color: "#7A5C28" }}>
                    {clinicVisits
                      ? "If Dr Hemangi finds during your video consult that an in-person examination is needed, she'll guide you on arranging a clinic visit — your consult fee is adjusted against it."
                      : "If Dr Hemangi finds during your video consult that an in-person examination is needed, she'll explain what to arrange and where — and your consult fee is adjusted against it."}
                  </label>
                </div>
              </div>
            )}

            {/* ── step 2: service ── */}
            {step === 1 && (
              <div className="stepv on">
                <h3>What would you like to discuss?</h3>
                <p className="sub">This helps Dr Hemangi prepare — you can always raise other things during the call.</p>
                <div className="svc-list">
                  {categories.length === 0 && (
                    <p style={{ color: "var(--muted)", fontSize: ".9rem", padding: "8px 4px" }}>
                      Services are being updated — please check back shortly, or call the clinic.
                    </p>
                  )}
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`svc-row${svc?.id === c.id ? " sel" : ""}`}
                      onClick={() => {
                        setSvc(c);
                        if (c.slug === "follow-up") set("visit", "follow");
                      }}
                    >
                      <span className="rd"><i /></span>
                      <span className="tx">
                        <b>
                          {c.name}
                          {c.discount_label && <span className="pill gold" style={{ marginLeft: 6 }}>{c.discount_label}</span>}
                          {c.existing_patients_only && (
                            <span className="pill" style={{ marginLeft: 6 }}>returning patients</span>
                          )}
                        </b>
                        <span>{c.description}</span>
                      </span>
                      <span className="pr">
                        <b>
                          {c.discount_amount > 0 && (
                            <span style={{ textDecoration: "line-through", color: "var(--muted-2)", fontSize: ".78em", marginRight: 5 }}>
                              ₹{c.price}
                            </span>
                          )}
                          ₹{c.effective_price}
                        </b>
                        <span>{c.duration_minutes} min</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── step 3: date + time ── */}
            {step === 2 && (
              <div className="stepv on">
                <h3>Pick a date and time</h3>
                <p className="sub">Showing genuinely available slots · times in IST (Asia/Kolkata)</p>
                <div className="date-rail">
                  {loadingSlots && (
                    <span style={{ fontSize: ".85rem", color: "var(--muted)", padding: "8px 4px" }}>Loading availability…</span>
                  )}
                  {!loadingSlots && days.map((o) => {
                    const d = dateFromIso(o.date);
                    return (
                      <button
                        type="button"
                        key={o.date}
                        className={`dte${o.offDay ? " off" : ""}${date === o.date ? " sel" : ""}`}
                        onClick={() => { setDate(o.date); setSlot(null); }}
                      >
                        <span className="d">{DAYS[d.getDay()]}</span>
                        <span className="n">{d.getDate()}</span>
                        <span className="m">{MONTHS[d.getMonth()]}</span>
                      </button>
                    );
                  })}
                </div>

                {date && !day?.slots.length && (
                  <p style={{ color: "var(--muted)", fontSize: ".87rem", marginTop: 10 }}>
                    No slots available on this date — please pick another day.
                  </p>
                )}

                {([["Morning", "i-sun", am], ["Evening", "i-moon", pm]] as const).map(([label, icon, arr]) =>
                  arr.length ? (
                    <div className="slot-group" key={label}>
                      <div className="slot-lbl"><svg><use href={`#${icon}`} /></svg>{label}</div>
                      <div className="slots">
                        {arr.map((s) => (
                          <button
                            type="button"
                            key={s.time}
                            className={`slot${!s.available ? " off" : ""}${slot === s.time ? " sel" : ""}`}
                            onClick={() => setSlot(s.time)}
                          >
                            {fmt12(s.time)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null
                )}

                <div className="consent" style={{ marginTop: 24 }}>
                  <svg style={{ width: 18, height: 18, color: "var(--plum)", flex: "none", marginTop: 2 }}><use href="#i-clock" /></svg>
                  <label>Your slot is held for <b>10 minutes</b> while you complete this booking.</label>
                </div>
              </div>
            )}

            {/* ── step 4: details ── */}
            {step === 3 && (
              <div className="stepv on">
                <h3>A little about you</h3>
                <p className="sub">Only what&apos;s needed for your consultation. Nothing is shared with anyone else.</p>
                <div className="frm">
                  <Field label="Full name" required err={errors.name} msg="Please enter your name">
                    <input value={form.name} autoComplete="name" placeholder="e.g. Aditi Sharma"
                      onChange={(e) => set("name", e.target.value)} />
                  </Field>
                  <Field label="Age" required err={errors.age} msg="Please enter a valid age">
                    <input type="number" min={10} max={99} value={form.age} placeholder="e.g. 29"
                      onChange={(e) => set("age", e.target.value)} />
                  </Field>
                  <Field label="Mobile number" required err={errors.phone} hint="Used by the clinic to reach you" msg="Enter a valid 10-digit mobile number">
                    <div className="phone-in">
                      <span>+91</span>
                      <input type="tel" maxLength={10} value={form.phone} autoComplete="tel" placeholder="98765 43210"
                        onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))} />
                    </div>
                  </Field>
                  <Field label="Email" required err={errors.email} hint="Meet link, invite & reminders go here — and it's how you look up your bookings" msg="Enter a valid email address">
                    <input type="email" value={form.email} autoComplete="email" placeholder="you@email.com"
                      onChange={(e) => set("email", e.target.value)} />
                  </Field>

                  <div className="fld full">
                    <label>Have you consulted Dr Hemangi before?</label>
                    <div className="chips">
                      {[["first", "First time"], ["follow", "Follow-up"], ["second", "Second opinion"]].map(([v, l]) => (
                        <button type="button" key={v} className={`chip${form.visit === v ? " sel" : ""}`}
                          onClick={() => set("visit", v)}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Field full label="What's on your mind?" required err={errors.note} msg="Please tell us briefly why you're booking">
                    <textarea value={form.note}
                      placeholder="Describe your symptoms, how long they've been going on, and anything you'd like Dr Hemangi to look at. Write as much or as little as you like — this is private."
                      onChange={(e) => set("note", e.target.value)} />
                  </Field>

                  <div className="fld full">
                    <label>
                      Reports, scans or prescriptions <span style={{ color: "var(--muted-2)", fontWeight: 400 }}>(optional)</span>
                    </label>
                    <div
                      className="upload"
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInput.current?.click()}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInput.current?.click(); }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                    >
                      <svg><use href="#i-up" /></svg>
                      <b>Tap to upload or drag files here</b>
                      <span>PDF, JPG or PNG · up to {MAX_FILE_MB} MB each</span>
                    </div>
                    <input ref={fileInput} type="file" multiple hidden accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
                    <div className="up-list">
                      {files.map((f, i) => (
                        <div className="up-item" key={f.name + i}>
                          <svg><use href="#i-doc" /></svg>
                          {f.name}
                          <button className="x" type="button" aria-label={`Remove ${f.name}`}
                            onClick={() => setFiles((cur) => cur.filter((_, k) => k !== i))}>
                            <svg style={{ width: 13, height: 13 }}><use href="#i-x" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <span className="hint">Dr Hemangi reviews these before your slot, so you don&apos;t spend the consult explaining history.</span>
                  </div>

                  <div className="fld full">
                    <div className="consent">
                      <input type="checkbox" id="f-consent" checked={form.consent}
                        onChange={(e) => set("consent", e.target.checked)} />
                      <label htmlFor="f-consent">
                        I confirm the details above are correct and consent to a teleconsultation with Dr Hemangi. I
                        understand this does not replace emergency care.
                      </label>
                    </div>
                    {errors.consent && <span className="emsg" style={{ display: "block", marginTop: 6 }}>Please accept to continue</span>}
                  </div>
                </div>
              </div>
            )}

            {/* ── step 5: review + pay ── */}
            {step === 4 && order && svc && date && slot && (
              <div className="stepv on">
                <h3>Review &amp; confirm</h3>
                <p className="sub">Nothing is booked until payment succeeds.</p>
                <div className="sum">
                  <div className="sum-box">
                    <Row k="Doctor" v="Dr Hemangi · MBBS, DNB, D.G.O" />
                    <Row k="Consultation type" v="Video consultation" />
                    <Row k="Service" v={svc.name} />
                    <Row k="Date" v={fmtDate(dateFromIso(date))} />
                    <Row k="Time (IST)" v={`${fmt12(slot)} · ${svc.duration_minutes} min`} />
                    <Row k="Patient" v={`${form.name.trim()}, ${form.age}`} />
                    <Row k="Contact" v={`+91 ${form.phone} · ${form.email.trim()}`} />
                    {files.length > 0 && <Row k="Attachments" v={`${files.length} file${files.length > 1 ? "s" : ""}`} />}
                    {order.discount_amount > 0 && <Row k="Discount" v={`−₹${order.discount_amount}`} accent />}
                    <div className="sum-tot">
                      <span>Total payable</span>
                      <b>₹{fee}</b>
                    </div>
                    <div style={{ marginTop: 14, fontSize: ".78rem", color: "var(--muted)", lineHeight: 1.6 }}>
                      Your slot is reserved while you pay · free rescheduling up to 6 hours before
                    </div>
                  </div>
                  <div className="pay-box">
                    <h4>Secure payment</h4>
                    <p>Handled entirely by Razorpay. The clinic never sees your card or UPI details.</p>
                    <div className="pay-methods">
                      {["UPI", "Cards", "Netbanking", "Wallets", "EMI"].map((m) => <span key={m}>{m}</span>)}
                    </div>
                    <button className="btn btn-gold btn-block" onClick={pay}>Pay ₹{fee} securely</button>
                    <div className="secure"><svg><use href="#i-lock" /></svg> 256-bit encrypted · PCI DSS compliant</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── step 6: confirmation ── */}
            {step === 5 && done && svc && (
              <div className="stepv on">
                <div className="conf">
                  <div className="conf-ic">
                    <svg fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <span className="eyebrow c">Payment successful</span>
                  <h2 style={{ margin: "14px 0 12px" }}>You&apos;re booked in.</h2>
                  <p className="lede">
                    A confirmation, calendar invite and joining link are on their way to{" "}
                    <b style={{ color: "var(--plum-deep)" }}>{form.email.trim()}</b>. We&apos;ll remind you 24
                    hours and 1 hour before.
                  </p>

                  <div className="tkt">
                    <div className="tkt-h">
                      <div><span>Consultation with</span><b>Dr Hemangi</b></div>
                      <div className="tkt-id">{done.reference_code}</div>
                    </div>
                    <div className="tkt-b">
                      <div className="tkt-grid">
                        <Tkt k="Date" v={fmtDate(dateFromIso(done.scheduled_date))} />
                        <Tkt k="Time (IST)" v={`${fmt12(done.scheduled_time.slice(0, 5))} · ${svc.duration_minutes} min`} />
                        <Tkt k="Type" v="Video consultation" />
                        <Tkt k="Service" v={svc.name} />
                      </div>
                    </div>
                    <div className="tkt-perf" />
                    <div className="tkt-b" style={{ paddingTop: 20 }}>
                      <div className="tkt-grid">
                        <Tkt k="Patient" v={form.name.trim()} />
                        <Tkt k="Amount paid" v={`₹${done.price_final} · Paid`} />
                      </div>
                      {done.meet_link && (
                        <div className="meet-box">
                          <span className="mi">
                            <svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                              <path fill="#00832D" d="M2 7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
                              <path fill="#FFBA00" d="M15 9.5l5-3.2c.7-.4 1.5.1 1.5.9v9.6c0 .8-.8 1.3-1.5.9l-5-3.2z" />
                            </svg>
                          </span>
                          <span className="mt">
                            <b>Google Meet link</b>
                            <span>{done.meet_link.replace(/^https?:\/\//, "")}</span>
                          </span>
                          <button className="btn btn-g btn-sm" onClick={() => {
                            navigator.clipboard?.writeText(done.meet_link!).then(
                              () => toast("Meet link copied"),
                              () => toast("Meet link: " + done.meet_link)
                            );
                          }}>
                            Copy link
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="next-list">
                    <Nx icon="i-mail" b="Check your email now" s="Confirmation, GST invoice and a calendar invite you can add in one tap." />
                    <Nx icon="i-bell" b="Reminders are set" s="You'll hear from us 24 hours before and again 1 hour before your slot." />
                    <Nx icon="i-note" b="Prescription & notes after" s="Dr Hemangi's summary and prescription appear on your booking card within a few hours." />
                  </div>

                  <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 32 }}>
                    <button className="btn btn-p" onClick={() => router.push("/bookings")}>
                      View my bookings <svg><use href="#i-arr" /></svg>
                    </button>
                    <Link className="btn btn-g" href="/">Back to home</Link>
                  </div>
                </div>
              </div>
            )}

            {step < 4 && (
              <div className="bk-nav">
                <button className="btn btn-g" style={{ visibility: step === 0 ? "hidden" : "visible" }}
                  onClick={() => setStep((s) => Math.max(0, s - 1))}>
                  <svg><use href="#i-arrl" /></svg> Back
                </button>
                <button className="btn btn-p" onClick={next}>
                  Continue <svg><use href="#i-arr" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {processing && (
        <div className="ovl on">
          <div className="rzp">
            <div className="rzp-b" style={{ textAlign: "center", padding: "38px 10px" }}>
              <div className="spin" style={{ borderColor: "rgba(74,31,53,.15)", borderTopColor: "var(--plum)" }} />
              <p style={{ marginTop: 20, fontSize: ".9rem", color: "var(--plum-deep)", fontWeight: 600 }}>{processing}</p>
              <p style={{ fontSize: ".78rem", color: "var(--muted)", marginTop: 5 }}>Please don&apos;t close this window</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── small presentational helpers ────────────────────────────────────────── */

function Field({ label, required, err, hint, msg, full, children }: {
  label: string; required?: boolean; err?: boolean; hint?: string; msg?: string; full?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`fld${full ? " full" : ""}${err ? " err" : ""}`}>
      <label>{label} {required && <i>*</i>}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
      {msg && <span className="emsg">{msg}</span>}
    </div>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="sum-row">
      <span>{k}</span>
      <b style={accent ? { color: "var(--ok)" } : undefined}>{v}</b>
    </div>
  );
}

function Tkt({ k, v }: { k: string; v: string }) {
  return <div className="tkt-i"><span>{k}</span><b>{v}</b></div>;
}

function Nx({ icon, b, s }: { icon: string; b: string; s: string }) {
  return (
    <div className="nx">
      <span className="nxi"><svg><use href={`#${icon}`} /></svg></span>
      <span><b>{b}</b><span>{s}</span></span>
    </div>
  );
}
