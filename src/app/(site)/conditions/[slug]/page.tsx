import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCare } from "@/lib/site/settings";
import { CONDITIONS, conditionBySlug } from "@/lib/site/conditions";
import { Anatomy } from "@/components/site/Anatomy";
import { ConditionScene, TestsIllustration, LadderIllustration } from "@/components/site/ConditionScenes";
import { MedicalNote } from "@/components/site/MedicalNote";
import { InfoNote } from "@/components/site/InfoNote";
import { T } from "@/components/site/Lang";

export function generateStaticParams() {
  return CONDITIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = conditionBySlug(slug);
  if (!c) return {};
  return {
    title: c.name,
    description: `${c.tagline} Symptoms, the tests that matter, treatment options in order, and the myths — explained plainly by Dr Hemangi.`,
    alternates: { canonical: `/conditions/${c.slug}` },
  };
}

export default async function ConditionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = conditionBySlug(slug);
  if (!c) notFound();

  /* With online booking off these become "ask the clinic" instead of
     disappearing — a condition page with no action at the end is a dead end. */
  const { care, copy } = await getCare();
  const bookingOn = care.booking;
  const bookHref = bookingOn ? (c.bookService ? `/book?service=${c.bookService}` : "/book") : "/contact";
  /* "Contact the clinic" was the same label in both off states. A clinic that
     still sees people in person is being asked about an appointment, not just
     contacted. */
  const bookLabel = bookingOn ? c.bookLabel : copy.conditionCta;

  // Structured data so the explanation can surface directly in search results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: c.name,
    description: c.tagline,
    about: { "@type": "MedicalCondition", name: c.name },
    audience: { "@type": "Patient" },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── intro ── */}
      <section className="pg-head">
        <div className="wrap">
          <div className="cont-grid">
            <div className="rv">
              <span className="eyebrow"><T>{c.eyebrow}</T></span>
              <h2 style={{ margin: "14px 0 16px" }}><T>{c.name}</T></h2>
              <p className="lede"><T>{c.tagline}</T></p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 26 }}>
                <Link className="btn btn-p" href={bookHref}>
                  <T>{bookLabel}</T> <svg><use href="#i-arr" /></svg>
                </Link>
                <Link className="btn btn-g" href="/conditions"><T>All conditions →</T></Link>
              </div>
            </div>
            <div className="rv" data-d="1">
              <Anatomy kind={c.art} uid={c.slug.replace(/-/g, "")} />
            </div>
          </div>
        </div>
      </section>

      {/* ── what it is ── */}
      <section style={{ paddingTop: "clamp(20px,3vw,40px)" }}>
        <div className="wrap-n">
          <div className="rv">
            <div className="sec-title"><span>01</span><h3><T>What it actually is</T></h3></div>
            <div className="cont-body">
              {c.intro.map((p, i) => <p key={i}><T>{p}</T></p>)}
              <p style={{ color: "var(--muted)", fontSize: ".93rem" }}><em><T>{c.howCommon}</T></em></p>
            </div>
          </div>
          <div className="rv">
            <ConditionScene kind={c.art} uid={c.slug.replace(/-/g, "")} />
            <InfoNote kind="art" />
          </div>
        </div>
      </section>

      {/* ── symptoms + red flags ── */}
      <section style={{ paddingTop: 0 }}>
        <div className="wrap-n">
          <div className="rv">
            <div className="sec-title"><span>02</span><h3><T>What you might notice</T></h3></div>
            <ul className="chk" style={{ marginBottom: 34 }}>
              {c.symptoms.map((s) => (
                <li key={s}><svg><use href="#i-check" /></svg><T>{s}</T></li>
              ))}
            </ul>
          </div>
          <div className="flag rv">
            <h3><T>Don't wait for an appointment if…</T></h3>
            <ul className="chk">
              {c.redFlags.map((s) => (
                <li key={s}><svg><use href="#i-shield" /></svg><T>{s}</T></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── tests ── */}
      <section>
        <div className="wrap-n">
          <div className="rv">
            <div className="sec-title"><span>03</span><h3><T>The tests that are actually useful</T></h3></div>
            <p className="lede" style={{ marginBottom: 22 }}>
              Not everyone needs every test. This is what each one is for, so you know why it was ordered — or why it
              wasn&apos;t.
            </p>
            <TestsIllustration uid={c.slug.replace(/-/g, "")} />
            <div className="test-list">
              {c.tests.map((t) => (
                <div className="test" key={t.name}>
                  <b><T>{t.name}</T></b>
                  <span><T>{t.why}</T></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── treatment ── */}
      <section style={{ paddingTop: 0 }}>
        <div className="wrap-n">
          <div className="rv">
            <div className="sec-title"><span>04</span><h3><T>Treatment, in the order it's usually tried</T></h3></div>
            <LadderIllustration uid={c.slug.replace(/-/g, "")} />
            <div className="tier-list">
              {c.treatments.map((t) => (
                <div className="tier" key={t.tier}>
                  <b><T>{t.tier}</T></b>
                  <h4><T>{t.what}</T></h4>
                  <p><T>{t.note}</T></p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── myths ── */}
      <section>
        <div className="wrap-n">
          <div className="rv">
            <div className="sec-title"><span>05</span><h3><T>What you were probably told that isn't true</T></h3></div>
            <div className="myth-list">
              {c.myths.map((m) => (
                <div className="myth" key={m.myth}>
                  <div className="m"><T>{m.myth}</T></div>
                  <div className="t"><T>{m.truth}</T></div>
                </div>
              ))}
            </div>
          </div>

          <div className="band rv" style={{ marginTop: "clamp(36px,5vw,60px)" }}>
            <span className="eyebrow c"><T>Next step</T></span>
            <h2>Bring this to someone who has time.</h2>
            <p>
              A 25–40 minute consultation, on video, with a doctor who will explain what applies to you specifically —
              and what doesn&apos;t.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link className="btn btn-p btn-lg" href={bookHref}>
                <T>{bookLabel}</T> <svg><use href="#i-arr" /></svg>
              </Link>
              <Link className="btn btn-g btn-lg" href="/conditions"><T>Read another</T></Link>
            </div>
          </div>

          <MedicalNote />
        </div>
      </section>
    </main>
  );
}
