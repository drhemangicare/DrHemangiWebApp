import Link from "next/link";
import { getPublicSettings } from "@/lib/site/settings";
import { SERVICES } from "@/lib/site/content";

/* ────────────────────────────── credentials marquee ─────────────────────── */

const CREDS = [
  "M.B.B.S", "DNB (Obs & Gynae)", "D.G.O", "FMAS — Laparoscopic Surgeon",
  "Infertility Specialist", "IUI & IVF", "Hysteroscopy", "High-Risk Pregnancy",
];

export function Marquee() {
  // Duplicated inline (rather than cloned via JS after mount, as the original
  // did) so the seamless loop is present in the server-rendered HTML.
  const track = [...CREDS, ...CREDS];
  return (
    <div className="marq">
      <div className="marq-t" id="marq">
        {track.map((c, i) => (
          <span className="marq-i" key={i}>{c}</span>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────── services ────────────────────────────────── */

export function ServicesGrid({ limit }: { limit?: number }) {
  const list = limit ? SERVICES.slice(0, limit) : SERVICES;
  return (
    <div className="svc-grid">
      {list.map((s, i) => (
        <div className="card svc rv" id={s.id} key={s.id} data-d={(i % 3) || undefined}>
          <div className="svc-ic">
            <svg className={s.pulse ? "pulse-h" : undefined}><use href={`#${s.icon}`} /></svg>
          </div>
          <h3>{s.h}</h3>
          <p>{s.p}</p>
          <div className="svc-tags">{s.tags.map((t) => <span key={t}>{t}</span>)}</div>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────── fertility spotlight ─────────────────────── */

export function FertilitySpotlight() {
  return (
    <section className="fert" id="fertility">
      <div className="wrap">
        <div className="fert-in rv">
          <div className="fert-grid">
            <div>
              <span className="eyebrow">Infertility · IUI · IVF</span>
              <h2 style={{ margin: "16px 0 18px" }}>
                When the answer isn&apos;t
                <br />
                <em className="it" style={{ color: "#E7D5BC" }}>just keep trying</em>
              </h2>
              <p style={{ fontSize: "1.04rem", lineHeight: 1.75 }}>
                Fertility care goes wrong in two directions — waiting too long, or rushing to IVF before anyone looked
                for the real cause. Dr Hemangi&apos;s surgical training means structural problems get identified early;
                her fertility practice means you only escalate when escalation is the honest answer.
              </p>
              <p style={{ marginTop: 18, fontSize: ".95rem" }}>
                Every plan starts with a 40-minute mapping consult: your history, both partners&apos; reports, and a
                written timeline of what happens next and roughly what it will cost.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 32 }}>
                <Link className="btn btn-gold" href="/book?service=fertility">
                  Book fertility consult <svg><use href="#i-arr" /></svg>
                </Link>
                <Link
                  href="/faq"
                  className="btn btn-g"
                  style={{ background: "rgba(255,255,255,.1)", color: "#fff", borderColor: "rgba(255,255,255,.2)" }}
                >
                  Common questions
                </Link>
              </div>
            </div>
            <div className="fert-stats ekg-wrap">
              <div className="fs"><b>40 min</b><span>Dedicated first fertility mapping consultation</span></div>
              <div className="fs"><b>Both</b><span>Partners evaluated together, from day one</span></div>
              <div className="fs"><b>FMAS</b><span>Laparoscopy &amp; hysteroscopy done in-house</span></div>
              <div className="fs"><b>Written</b><span>Costed treatment timeline before you commit</span></div>
              <svg className="ekg" viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true">
                <path
                  d="M0 30 H160 L178 6 L196 54 L212 18 L228 30 H400 L418 6 L436 54 L452 18 L468 30 H600"
                  fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────── how it works ────────────────────────────── */

const STEPS = [
  ["Pick a time that suits you", "A private video consultation on Google Meet, with live availability for the next 21 days."],
  ["Choose your slot", "Only genuinely free times are shown. Slots hold for 10 minutes while you complete the booking."],
  ["Pay securely", "UPI, cards, netbanking or wallets through Razorpay. Nothing is confirmed until payment succeeds."],
  ["Check your inbox", "Confirmation, calendar invite and Meet link arrive instantly — with reminders 24 hours and 1 hour before."],
];

export function HowItWorks() {
  return (
    <section style={{ background: "linear-gradient(180deg,transparent,rgba(250,229,225,.42),transparent)" }}>
      <div className="wrap">
        <div className="head mid rv">
          <span className="eyebrow c">Booking, simplified</span>
          <h2>Four taps. No password.<br />No forms you&apos;ll abandon.</h2>
          <p className="lede">We deliberately did not build a login. Your email is your account — that&apos;s it.</p>
        </div>
        <div className="steps">
          {STEPS.map(([h, p], i) => (
            <div className="step rv" key={h} data-d={i || undefined}>
              <div className="step-n">{i + 1}</div>
              <h4>{h}</h4>
              <p>{p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────── about ───────────────────────────────────── */

const CREDENTIALS = [
  ["i-shield", "M.B.B.S · DNB · D.G.O", "Obstetrics & Gynaecology", false],
  ["i-micro", "FMAS", "Fellow, Minimal Access Surgery", false],
  ["i-heart", "Infertility Specialist", "IUI & IVF pathways", true],
  ["i-spark", "High-Risk Obstetrics", "Complex pregnancy management", false],
] as const;

export async function AboutDoctor() {
  const s = await getPublicSettings();
  return (
    <section id="about">
      <div className="wrap about-grid">
        <div className="rv">
          <div className="dr-photo" id="dr-photo">
            {s.doctor_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.doctor_photo_url}
                alt="Dr Hemangi"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
              />
            ) : (
              <svg viewBox="0 0 200 240" fill="none" stroke="#4A1F35" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity=".55">
                <circle cx="100" cy="76" r="34" />
                <path d="M100 110c-30 0-52 20-58 48-2 9-3 20-3 30h122c0-10-1-21-3-30-6-28-28-48-58-48z" />
                <path d="M78 118c6 14 13 22 22 22s16-8 22-22" />
                <path d="M100 140v34M92 156h16" />
                <path d="M66 62c4-18 18-28 34-28s30 10 34 28" />
              </svg>
            )}
            <div className="dr-badge">
              <b>Dr Hemangi</b>
              <span>MBBS · DNB · D.G.O · FMAS</span>
            </div>
          </div>
        </div>
        <div className="rv" data-d="1">
          <span className="eyebrow">About the doctor</span>
          <h2 style={{ margin: "16px 0 20px" }}>The doctor 50,000 women<br />already follow for answers</h2>
          <p className="lede">
            Dr Hemangi built a following by doing something unusual online — explaining gynaecology plainly, without
            shame and without scare tactics. The clinic runs on the same principle: you should leave a consultation
            understanding your own body better than when you walked in.
          </p>
          <p className="lede" style={{ marginTop: 16 }}>
            She trained as an obstetrician and gynaecologist, went on to become an FMAS-certified minimal access
            surgeon, and practises across fertility, high-risk obstetrics and aesthetic medicine — a range that means
            fewer referrals and more continuity for the women she treats.
          </p>
          <div className="creds">
            {CREDENTIALS.map(([icon, b, sub, pulse]) => (
              <div className="cred" key={b}>
                <svg className={pulse ? "pulse-h" : undefined}><use href={`#${icon}`} /></svg>
                <span>
                  <b>{b}</b>
                  <span>{sub}</span>
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
            <Link className="btn btn-p" href="/book">
              Book with Dr Hemangi <svg><use href="#i-arr" /></svg>
            </Link>
            <a className="btn btn-g" href="https://instagram.com/gynaec_fact_drhemangi" target="_blank" rel="noopener noreferrer">
              <svg><use href="#i-ig" /></svg> @gynaec_fact_drhemangi
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────── clinic / contact ────────────────────────── */

/**
 * The "come and see us" block, on the home page and the contact page.
 *
 * Renders nothing when in-person visits are switched off in Admin → Settings.
 * That switch exists for the weeks when the clinic is closed, moving, or fully
 * booked in person: leaving an address and "call to confirm a visit" up when
 * nobody can be seen is worse than saying nothing, because a patient acts on
 * it and gets turned away.
 */
export async function ClinicVisit() {
  const s = await getPublicSettings();
  if (!s.clinic_visit_enabled) return null;
  return (
    <section id="clinic">
      <div className="wrap">
        <div className="head mid rv">
          <span className="eyebrow c">In person</span>
          <h2>Prefer to visit the clinic?</h2>
          <p className="lede">
            Online video consultations are booked instantly. In-clinic visits are arranged directly — here&apos;s where
            to find us.
          </p>
        </div>
        <div
          className="card rv"
          style={{ maxWidth: 760, marginInline: "auto", padding: "clamp(24px,4vw,42px)", display: "grid", gap: 22, gridTemplateColumns: "1fr 1fr" }}
        >
          <div className="cred" style={{ background: "transparent", border: "none", padding: 0 }}>
            <svg><use href="#i-pin" /></svg>
            <span><b>Address</b><span>{s.clinic_address || "Address coming soon — Dr Hemangi's Clinic"}</span></span>
          </div>
          <div className="cred" style={{ background: "transparent", border: "none", padding: 0 }}>
            <svg><use href="#i-clock" /></svg>
            <span><b>Timings</b><span>{s.clinic_timing || "Timings coming soon"}</span></span>
          </div>
          <div className="cred" style={{ background: "transparent", border: "none", padding: 0 }}>
            <svg><use href="#i-phone" /></svg>
            <span><b>Call to confirm a visit</b><span>+91 98XXX XXXXX</span></span>
          </div>
          <div className="cred" style={{ background: "transparent", border: "none", padding: 0 }}>
            <svg><use href="#i-video" /></svg>
            <span><b>Booking online?</b><span>Only video consultations can be booked on this site.</span></span>
          </div>
          <div style={{ gridColumn: "1/-1", display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 6, borderTop: "1px dashed var(--line-soft)" }}>
            {s.clinic_map_link && (
              <a className="btn btn-p" href={s.clinic_map_link} target="_blank" rel="noopener noreferrer">
                <svg><use href="#i-pin" /></svg> Open in Google Maps
              </a>
            )}
            <Link className="btn btn-g" href="/book">
              Book a video consult instead <svg><use href="#i-arr" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────── faq ─────────────────────────────────────── */

/* ────────────────────────────── cta band ────────────────────────────────── */

export function CtaBand() {
  return (
    <section style={{ paddingTop: 20 }}>
      <div className="wrap">
        <div className="band rv">
          <span className="eyebrow c">Book in under two minutes</span>
          <h2>Whatever chapter you&apos;re in,<br />let&apos;s start with a conversation.</h2>
          <p>Twenty-five unhurried minutes with a doctor who will actually explain what&apos;s happening.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link className="btn btn-p btn-lg" href="/book">
              Book a consultation <svg><use href="#i-arr" /></svg>
            </Link>
            <Link className="btn btn-g btn-lg" href="/bookings">I already have a booking</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
