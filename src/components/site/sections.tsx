import Link from "next/link";
import { getCare } from "@/lib/site/settings";
import { SERVICES } from "@/lib/site/content";
import { DoctorPhoto } from "./DoctorPhoto";

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

export async function FertilitySpotlight() {
  const { copy } = await getCare();
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
              {/* A "40-minute mapping consult" is an appointment being
                  promised. With no appointments on offer the same plan is
                  described without the scheduling claim. */}
              <p style={{ marginTop: 18, fontSize: ".95rem" }}>{copy.fertilityConsult}</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 32 }}>
                <Link className="btn btn-gold" href={copy.fertilityCta.href}>
                  {copy.fertilityCta.label} <svg><use href="#i-arr" /></svg>
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
              {/* First tile states a consultation length in the modes that
                  have consultations, and a fact about the workup in the mode
                  that does not — the grid keeps its four tiles either way. */}
              <div className="fs"><b>{copy.fertilityStat[0]}</b><span>{copy.fertilityStat[1]}</span></div>
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

/**
 * The "how this works" band.
 *
 * It used to describe the online booking flow and `return null` when booking
 * was off, which left the home page and /fertility with a missing beat between
 * the fertility spotlight and the doctor. Worse, it was the only place that
 * explained how to actually be seen — so switching booking off removed the
 * instructions along with the wizard.
 *
 * Now every mode has three or four real steps: the booking flow when there is
 * one, how a clinic appointment is arranged when visits are the offer, and how
 * to reach the clinic when neither is on. The section always renders.
 */
export async function HowItWorks() {
  const { copy } = await getCare();
  const { eyebrow, title, lede, steps } = copy.process;

  return (
    <section style={{ background: "linear-gradient(180deg,transparent,rgba(250,229,225,.42),transparent)" }}>
      <div className="wrap">
        <div className="head mid rv">
          <span className="eyebrow c">{eyebrow}</span>
          <h2>{title[0]}<br />{title[1]}</h2>
          <p className="lede">{lede}</p>
        </div>
        <div className="steps" style={{ ["--steps" as string]: steps.length }}>
          {steps.map(([h, p], i) => (
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
  const { care, copy, settings: s } = await getCare();
  return (
    <section id="about">
      <div className="wrap about-grid">
        <div className="rv">
          <div className="dr-photo" id="dr-photo">
            <DoctorPhoto src={s.doctor_photo_url} />
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
            {care.booking ? (
              <Link className="btn btn-p" href="/book">
                Book with Dr Hemangi <svg><use href="#i-arr" /></svg>
              </Link>
            ) : (
              <Link className="btn btn-p" href={copy.heroPrimary.href}>
                {copy.heroPrimary.label} <svg><use href="#i-arr" /></svg>
              </Link>
            )}
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
 * It really is on both now. For a long time this comment was aspirational:
 * only contact/page.tsx imported it, so the in-person switch had no visible
 * effect on the home page whatsoever.
 *
 * Renders nothing when in-person visits are switched off in Admin → Settings.
 * That switch exists for the weeks when the clinic is closed, moving, or fully
 * booked in person: leaving an address and "call to confirm a visit" up when
 * nobody can be seen is worse than saying nothing, because a patient acts on
 * it and gets turned away.
 */
export async function ClinicVisit() {
  const { care, copy, settings: s } = await getCare();
  if (!care.clinic) return null;
  return (
    <section id="clinic">
      <div className="wrap">
        <div className="head mid rv">
          <span className="eyebrow c">In person</span>
          <h2>Prefer to visit the clinic?</h2>
          {/* This line used to advertise instant online booking regardless of
              whether online consultations were switched on — so a clinic
              offering nothing but in-person visits still told every reader
              their video consult would be confirmed instantly. */}
          <p className="lede">{copy.clinicLede}</p>
        </div>
        <div
          className="card cred-grid rv"
          style={{ maxWidth: 760, marginInline: "auto", padding: "clamp(24px,4vw,42px)" }}
        >
          <div className="cred">
            <svg><use href="#i-pin" /></svg>
            <span><b>Address</b><span>{s.clinic_address || "Address coming soon — Dr Hemangi's Clinic"}</span></span>
          </div>
          <div className="cred">
            <svg><use href="#i-clock" /></svg>
            <span><b>Timings</b><span>{s.clinic_timing || "Timings coming soon"}</span></span>
          </div>
          <div className="cred">
            <svg><use href="#i-phone" /></svg>
            <span><b>Call to confirm a visit</b><span>+91 98XXX XXXXX</span></span>
          </div>
          {/* Fourth tile. With online consultations on it explains what the
              site can and cannot book; with them off it would be pointing at a
              wizard that is not there, so it carries the written route in
              instead and the card keeps its 2x2 balance. */}
          <div className="cred">
            <svg><use href={care.booking ? "#i-video" : "#i-mail"} /></svg>
            <span><b>{copy.clinicAside[0]}</b><span>{copy.clinicAside[1]}</span></span>
          </div>
          {/* The map link is optional — it is blank until the clinic address
              reaches settings. When it is missing the row lost its only
              primary button and the remaining ghost button sat alone under the
              divider looking like an afterthought, so whatever is left leads
              instead. */}
          <div style={{ gridColumn: "1/-1", display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 6, borderTop: "1px dashed var(--line-soft)" }}>
            {s.clinic_map_link && (
              <a className="btn btn-p" href={s.clinic_map_link} target="_blank" rel="noopener noreferrer">
                <svg><use href="#i-pin" /></svg> Open in Google Maps
              </a>
            )}
            {care.booking ? (
              <Link className={`btn ${s.clinic_map_link ? "btn-g" : "btn-p"}`} href="/book">
                Book a video consult instead <svg><use href="#i-arr" /></svg>
              </Link>
            ) : (
              /* Not a second copy of "contact us" — the reader is already on
                 the clinic card. This is the other thing they came for. */
              <a className={`btn ${s.clinic_map_link ? "btn-g" : "btn-p"}`} href={`mailto:${s.support_email}`}>
                <svg><use href="#i-mail" /></svg> {s.support_email}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────── faq ─────────────────────────────────────── */

/* ────────────────────────────── cta band ────────────────────────────────── */

export async function CtaBand() {
  const { copy } = await getCare();
  const { eyebrow, body, primary, secondary } = copy.band;

  /* The closing band is the page's last word, so it is rewritten per mode
     rather than removed — "Book in under two minutes / Twenty-five unhurried
     minutes" is a promise about a wizard, and repeating it on a site that
     books nothing is exactly the mismatch this whole pass exists to fix. The
     heading is the one line that holds in every mode; it is about the patient,
     not the mechanism. */
  return (
    <section style={{ paddingTop: 20 }}>
      <div className="wrap">
        <div className="band rv">
          <span className="eyebrow c">{eyebrow}</span>
          <h2>Whatever chapter you&apos;re in,<br />let&apos;s start with a conversation.</h2>
          <p>{body}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link className="btn btn-p btn-lg" href={primary.href}>
              {primary.label} <svg><use href="#i-arr" /></svg>
            </Link>
            <Link className="btn btn-g btn-lg" href={secondary.href}>{secondary.label}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
