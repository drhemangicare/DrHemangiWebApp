"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FigureStage } from "./FigureStage";

const STEPS = [
  {
    eyebrow: "Chapter One",
    title: "Understanding what's normal — and what isn't",
    lede: "Irregular cycles, painful periods, PCOS, unexplained weight shifts, that thing you googled at 2am. Nothing is too small or too awkward to bring here.",
    items: [
      "Cycle & hormone evaluation, PCOS management",
      "Contraception counselling, without judgement",
      "Infections, discharge, intimate health concerns",
      "Adolescent & first-visit gynaecology",
    ],
    links: [
      { href: "/conditions/pcos", label: "PCOS", note: "Common, and the most misunderstood" },
      { href: "/conditions/irregular-periods", label: "Irregular periods", note: "A symptom, never a diagnosis" },
      { href: "/conditions/endometriosis", label: "Endometriosis", note: "Period pain that stops your life" },
    ],
    more: { href: "/conditions", label: "All conditions" },
  },
  {
    eyebrow: "Chapter Two",
    title: "The waiting is the hardest part. You won't do it alone.",
    lede: "A clear plan instead of guesswork — timed cycles, honest odds, and escalation to IUI or IVF only when it genuinely helps. Dr Hemangi is an FMAS laparoscopic surgeon, so surgical causes are found early, not after years.",
    items: [
      "Fertility workup for both partners",
      "Ovulation induction & follicular monitoring",
      "IUI and IVF planning, step by step",
      "Diagnostic & operative laparoscopy, hysteroscopy",
    ],
    links: [
      { href: "/conditions/difficulty-conceiving", label: "Difficulty conceiving", note: "Two people, one investigation" },
      { href: "/conditions/recurrent-miscarriage", label: "Recurrent miscarriage", note: "It is not something you caused" },
      { href: "/conditions/fibroids", label: "Uterine fibroids", note: "Extremely common, almost always benign" },
    ],
    more: { href: "/fertility", label: "Fertility & IVF" },
  },
  {
    eyebrow: "Chapter Three",
    title: "Nine months of somebody actually picking up the phone",
    lede: 'Structured antenatal care with the scans and screenings that matter, plus quick video check-ins between visits — because "is this normal?" shouldn\'t wait two weeks.',
    items: [
      "Complete antenatal package, trimester by trimester",
      "High-risk pregnancy & gestational diabetes care",
      "Growth scans, birth planning, nutrition guidance",
      "Between-visit video consults for the small worries",
    ],
    links: [
      { href: "/pregnancy/first-trimester", label: "First trimester", note: "Everything is being built" },
      { href: "/pregnancy/second-trimester", label: "Second trimester", note: "Usually the kindest stretch" },
      { href: "/pregnancy/third-trimester", label: "Third trimester", note: "Growth and preparation" },
    ],
    more: { href: "/pregnancy", label: "The 40-week journey" },
  },
  {
    eyebrow: "Chapter Four",
    title: "After the baby, someone should still be asking about you",
    lede: "Recovery, feeding, mood, pelvic floor, intimacy, contraception, and the slow work of feeling like yourself again — followed properly, not squeezed into the baby's checkup.",
    items: [
      "Postpartum recovery & lactation support",
      "Postnatal mood screening and referral",
      "Pelvic floor, scar and intimate wellness care",
      "Perimenopause & long-term hormonal health",
    ],
    links: [
      { href: "/services#postpartum", label: "Postpartum & menopause", note: "Recovery, mood, pelvic floor, bone health" },
      { href: "/services#screening", label: "Preventive screening", note: "Pap, HPV and the well-woman review" },
      { href: "/conditions", label: "Hormonal conditions", note: "Everything we investigate and treat" },
    ],
    more: { href: "/services", label: "All services" },
  },
];

/**
 * How present the figure behind the chapters is.
 *
 * Two values, because the space either side of her is not the same at every
 * width. From 901px up she sits in a clear channel between the chapter and its
 * destinations panel, and at 0.26 she read as a smudge in a gap rather than as
 * art. Below that the layout is a single column and she is directly behind the
 * copy — the same 0.46 puts a face behind the sentence you are reading. The
 * phone layout was already right and is deliberately left alone.
 */
const BASE_OPACITY_WIDE = 0.46;
const BASE_OPACITY_NARROW = 0.24;

/**
 * The four chapters as one scrolling sequence with the illustration on a
 * sticky layer behind the copy. Replaced a tab strip that duplicated the
 * hero's chapter pills.
 *
 * Deliberately NOT an IntersectionObserver. An observer reports *crossings*,
 * not state: scroll fast and several chapters cross in one batch, and the
 * callback keeps whichever entry it processed last — which is not necessarily
 * the chapter on screen. That produced a figure that looked random and lagged
 * the copy. Instead every animation frame recomputes which chapter is nearest
 * the middle of the viewport and derives the lit chapter, the figure and the
 * layer opacity from that one number, so they cannot drift apart no matter how
 * the page is scrolled, resized or deep-linked into.
 */
export function ChapterScroller() {
  const [live, setLive] = useState(0);
  const flowRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const rm = matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(rm.matches);
    if (rm.matches) return;

    let tick = false;
    const apply = () => {
      tick = false;
      const mid = innerHeight / 2;

      // A chapter goes live only once its heading has actually arrived on
      // screen: the last block whose top edge has crossed the read line.
      //
      // The previous rule ("whichever block centre is nearest the viewport
      // centre") switched at the midpoint between two blocks, which on a
      // short viewport lit a chapter whose heading was still below the fold —
      // you saw the art fill the window while the copy you were meant to be
      // reading was cut off at the bottom. Anchoring on the top edge means the
      // heading is never lower than READ_LINE when its chapter becomes
      // current, at any window height.
      const READ_LINE = innerHeight * 0.45;
      let best = 0;
      for (let i = 0; i < stepRefs.current.length; i++) {
        const el = stepRefs.current[i];
        if (!el) continue;
        if (el.getBoundingClientRect().top <= READ_LINE) best = i;
      }
      setLive((prev) => (prev === best ? prev : best));

      // Fade at the section's edges. The art is pinned to the middle of the
      // viewport, so it has to be gone before the next section's heading
      // slides underneath it.
      const flow = flowRef.current;
      const bg = bgRef.current;
      if (flow && bg) {
        const r = flow.getBoundingClientRect();
        const out = (r.bottom - innerHeight * 0.7) / (innerHeight * 0.26);
        const inn = (mid - r.top) / (innerHeight * 0.3);
        // matches the 901px breakpoint the two-column row uses in site.css
        const base = innerWidth >= 901 ? BASE_OPACITY_WIDE : BASE_OPACITY_NARROW;
        bg.style.opacity = (base * Math.max(0, Math.min(1, out, inn))).toFixed(3);
      }
    };
    const schedule = () => { if (!tick) { tick = true; requestAnimationFrame(apply); } };
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule, { passive: true });
    apply();
    return () => { removeEventListener("scroll", schedule); removeEventListener("resize", schedule); };
  }, []);

  return (
    <section className="journey" id="journey">
      <div className="wrap">
        <div className="j-flow" id="j-flow" ref={flowRef}>
          <div className="j-bg" aria-hidden="true">
            <div className="j-bg-in" ref={bgRef}>
              <div className="j-rig">
                <div className="orbits">
                  <span className="orb-ring o2"><i /></span>
                  <span className="orb-ring o3"><i /></span>
                </div>
                <FigureStage active={live} uid="j" />
              </div>
            </div>
          </div>

          <div className="head mid rv">
            <span className="eyebrow c">One doctor. Every stage.</span>
            <h2>
              Your body has chapters.
              <br />
              <em className="it">We know all of them.</em>
            </h2>
            <p className="lede">
              Most clinics treat a symptom. We follow a life — so the person who guided your first cycle is the same one
              who holds your hand at delivery, and checks in six weeks after.
            </p>
          </div>

          <div className="j-steps" id="j-steps">
            {STEPS.map((s, i) => (
              /* Chapter and its destinations are one row. Above 901px the two
                 sit either side of the pinned figure and swap sides each
                 chapter; below that the row simply stacks, which is why the
                 phone layout is untouched by all of this. */
              <div className={`j-row${reduced || i === live ? " live" : ""}`} key={i}>
                <article
                  data-j={i}
                  ref={(el) => { stepRefs.current[i] = el; }}
                  className={`j-step rv${reduced || i === live ? " live" : ""}`}
                >
                  <span className="eyebrow">{s.eyebrow}</span>
                  <h3>{s.title}</h3>
                  <p className="lede">{s.lede}</p>
                  <ul className="j-list">
                    {s.items.map((t) => (
                      <li key={t}><svg><use href="#i-check" /></svg>{t}</li>
                    ))}
                  </ul>
                </article>

                {/* Every chapter now has somewhere to go. Before this the only
                    way out of four persuasive chapters was a single button
                    after all of them — a reader sold at chapter two had to
                    scroll past two more to act on it. */}
                <aside className="j-more rv" aria-label={`Read more about ${s.eyebrow}`}>
                  <span className="eyebrow">Read about this</span>
                  <ul>
                    {s.links.map((l) => (
                      <li key={l.href + l.label}>
                        <Link href={l.href} prefetch={false}>
                          {/* Label and note are one stacked block so the arrow
                              stays pinned to the right edge of the row. Without
                              the note the row was a two-word label with its
                              arrow 650px away across an empty card. */}
                          <span className="j-mt">
                            <strong>{l.label}</strong>
                            <em>{l.note}</em>
                          </span>
                          <svg aria-hidden="true"><use href="#i-arr" /></svg>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link className="j-more-all" href={s.more.href} prefetch={false}>
                    {s.more.label}<svg aria-hidden="true"><use href="#i-arr" /></svg>
                  </Link>
                </aside>
              </div>
            ))}
          </div>
          {/* The section used to end with a single "Book for this stage"
              button. It is gone: every chapter now carries its own way
              onward, and the page already has a booking CTA in the header,
              in the sticky mobile bar and in the band below this section —
              a fifth one here was repetition, not persuasion. */}
        </div>
      </div>
    </section>
  );
}
