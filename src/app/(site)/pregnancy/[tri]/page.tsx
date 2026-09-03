import type { Metadata } from "next";
import { getCare } from "@/lib/site/settings";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MILESTONES, TRI_DETAIL, TRI_SLUGS, TRIMESTERS, triBySlug, trimesterOf,
} from "@/lib/site/pregnancy";
import { FetalStageArt } from "@/components/site/FetalStage";
import { WeekExplorer } from "@/components/site/WeekExplorer";
import { MedicalNote } from "@/components/site/MedicalNote";
import { InfoNote } from "@/components/site/InfoNote";
import { ScanToggle } from "@/components/site/ScanView";
import { T } from "@/components/site/Lang";

export function generateStaticParams() {
  return TRI_SLUGS.map((tri) => ({ tri }));
}

export async function generateMetadata({ params }: { params: Promise<{ tri: string }> }): Promise<Metadata> {
  const { tri } = await params;
  const t = triBySlug(tri);
  if (!t) return {};
  return {
    title: t.label,
    description: `${t.label} of pregnancy, weeks ${t.weeks[0]}–${t.weeks[1]}: what is developing, what you may feel, the scans and checks that belong to this stage, and the signs that need a call today.`,
    alternates: { canonical: `/pregnancy/${tri}` },
  };
}

export default async function TrimesterPage({ params }: { params: Promise<{ tri: string }> }) {
  /* With booking off these rows used to lose their primary button and leave a
     single ghost link where a pair had been. Each mode now supplies its own
     first action, so the hierarchy survives. */
  const { care, copy } = await getCare();
  const bookingOn = care.booking;
  const { tri } = await params;
  const t = triBySlug(tri);
  if (!t) notFound();

  const n = t.n as 1 | 2 | 3;
  const detail = TRI_DETAIL[n];
  const mine = MILESTONES.filter((m) => trimesterOf(m.w) === n);
  const idx = TRI_SLUGS.indexOf(tri as (typeof TRI_SLUGS)[number]);
  const prev = idx > 0 ? { slug: TRI_SLUGS[idx - 1], label: TRIMESTERS[idx - 1].label } : null;
  const next = idx < 2 ? { slug: TRI_SLUGS[idx + 1], label: TRIMESTERS[idx + 1].label } : null;
  const mid = Math.round((t.weeks[0] + t.weeks[1]) / 2);

  return (
    <main>
      <section className="pg-head">
        <div className="wrap">
          <div className="cont-grid">
            <div className="rv">
              <span className="eyebrow"><T>Weeks</T> {t.weeks[0]}–{t.weeks[1]}</span>
              <h2 style={{ margin: "14px 0 16px" }}><T>{t.label}</T></h2>
              <p className="lede"><T>{t.blurb}</T></p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 26 }}>
                {bookingOn ? (
                  <Link className="btn btn-p" href="/book?service=antenatal">
                    <T>Book antenatal care</T> <svg><use href="#i-arr" /></svg>
                  </Link>
                ) : (
                  <Link className="btn btn-p" href={copy.heroPrimary.href}>
                    <T>{care.clinic ? "Ask about antenatal care" : "Contact the clinic"}</T>{" "}
                    <svg><use href="#i-arr" /></svg>
                  </Link>
                )}
                <Link className="btn btn-g" href="/pregnancy"><T>The whole journey</T></Link>
              </div>
            </div>
            <div className="rv" data-d="1">
              <FetalStageArt week={mid} uid={`t${n}`} />
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: "clamp(16px,2.5vw,34px)" }}>
        <div className="wrap-n">
          <div className="rv">
            <div className="sec-title"><span>01</span><h3><T>What this stretch is really about</T></h3></div>
            <div className="cont-body">
              {detail.intro.map((p, i) => <p key={i}><T>{p}</T></p>)}
            </div>
          </div>
        </div>
      </section>

      {/* milestones inside this trimester, each with its own illustration */}
      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="rv">
            <div className="sec-title"><span>02</span><h3><T>The milestones</T></h3></div>
          </div>
          <ScanToggle className="tri-toggle" />
          <div className="ms-list">
            {mine.map((m, i) => (
              <article className="ms rv" key={m.w} data-d={i % 2 ? "1" : undefined}>
                <div className="ms-art">
                  <FetalStageArt week={m.w} uid={`m${m.w}`} cap={false} note=" " />
                  <b><T>Week</T> {m.w}</b>
                </div>
                <div>
                  <span className="eyebrow"><T>{m.eyebrow}</T></span>
                  <h4><T>{m.title}</T></h4>
                  <p><T>{m.body}</T></p>
                  <ul className="j-list">
                    {m.points.map((p) => (
                      <li key={p}><svg><use href="#i-check" /></svg><T>{p}</T></li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
          <InfoNote kind="size" />
        </div>
      </section>

      <section>
        <div className="wrap-n">
          <div className="rv">
            <div className="sec-title"><span>03</span><h3><T>Your appointments and checks</T></h3></div>
            <div className="test-list">
              {detail.checks.map((c) => (
                <div className="test" key={c.name}>
                  <b><T>{c.name}</T></b>
                  <i><T>{c.when}</T></i>
                  <span><T>{c.why}</T></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap-n">
          <div className="rv">
            <div className="sec-title"><span>04</span><h3><T>What you may feel</T></h3></div>
            <ul className="chk" style={{ marginBottom: 34 }}>
              {detail.feel.map((s) => (
                <li key={s}><svg><use href="#i-check" /></svg><T>{s}</T></li>
              ))}
            </ul>
          </div>
          <div className="flag rv">
            <h3><T>Call today — don't wait for the next appointment</T></h3>
            <ul className="chk">
              {detail.redFlags.map((s) => (
                <li key={s}><svg><use href="#i-shield" /></svg><T>{s}</T></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="rv">
            <div className="sec-title"><span>05</span><h3><T>Your week in detail</T></h3></div>
            <WeekExplorer from={t.weeks[0]} to={t.weeks[1]} />
          </div>

          <div className="wk-steps rv" style={{ justifyContent: "center", marginTop: "clamp(28px,4vw,44px)" }}>
            {prev
              ? <Link href={`/pregnancy/${prev.slug}`}><svg><use href="#i-arrl" /></svg> <T>{prev.label}</T></Link>
              : <span><svg><use href="#i-arrl" /></svg> {t.label}</span>}
            <Link href="/pregnancy"><T>The whole journey</T></Link>
            {next
              ? <Link href={`/pregnancy/${next.slug}`}><T>{next.label}</T> <svg><use href="#i-arr" /></svg></Link>
              : <span>{t.label} <svg><use href="#i-arr" /></svg></span>}
          </div>

          <div className="band rv" style={{ marginTop: "clamp(32px,4.5vw,52px)" }}>
            {/* This band promised "quick video check-ins" on every trimester
                page regardless of whether video consultations were switched
                on — the last unflagged consultation promise on the site. */}
            <span className="eyebrow c"><T>{copy.antenatalBand.eyebrow}</T></span>
            <h2>{copy.antenatalBand.heading}</h2>
            <p>{copy.antenatalBand.body}</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {bookingOn ? (
                <Link className="btn btn-p btn-lg" href="/book">Book a consultation <svg><use href="#i-arr" /></svg></Link>
              ) : (
                <Link className="btn btn-p btn-lg" href={copy.heroPrimary.href}>
                  {copy.conditionCta} <svg><use href="#i-arr" /></svg>
                </Link>
              )}
              <Link className="btn btn-g btn-lg" href="/services">See all services</Link>
            </div>
          </div>

          <MedicalNote />
        </div>
      </section>
    </main>
  );
}
