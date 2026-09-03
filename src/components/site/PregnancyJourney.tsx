"use client";
import { useEffect, useRef, useState } from "react";
import { MILESTONES, TRIMESTERS, trimesterOf, weekData } from "@/lib/site/pregnancy";
import { FetalStageArt } from "./FetalStage";
import { useLang } from "./Lang";
import { InfoNote } from "./InfoNote";
import { ScanToggle } from "./ScanView";

/**
 * The pregnancy journey.
 *
 * This replaces forty separate week pages. Nobody navigates forty pages, and
 * splitting it that way buried the eight moments patients actually ask about.
 * Here the milestones scroll past a single illustration that grows continuously
 * as you go — the week number is interpolated between the milestone on screen
 * and the next one, so the picture, the number and the words can never drift
 * apart. (That drift is exactly what went wrong the first time this pattern was
 * built with an IntersectionObserver: an observer reports crossings, not state,
 * so a fast scroll leaves it showing whichever entry it happened to process
 * last. Everything here is recomputed from scroll position every frame.)
 */
export function PregnancyJourney() {
  const [week, setWeek] = useState(MILESTONES[0].w);
  const [live, setLive] = useState(0);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const { t: tr } = useLang();   // `t` is taken by the trimester/point map vars below

  useEffect(() => {
    const rm = matchMedia("(prefers-reduced-motion: reduce)");
    let tick = false;

    const apply = () => {
      tick = false;
      const READ_LINE = innerHeight * 0.42;
      const els = stepRefs.current;
      let i = 0;
      for (let n = 0; n < els.length; n++) {
        const el = els[n];
        if (el && el.getBoundingClientRect().top <= READ_LINE) i = n;
      }
      setLive((p) => (p === i ? p : i));

      // fraction of the way from this milestone to the next
      let w = MILESTONES[i].w;
      if (!rm.matches) {
        const a = els[i], b = els[i + 1];
        if (a && b) {
          const ta = a.getBoundingClientRect().top, tb = b.getBoundingClientRect().top;
          const raw = tb === ta ? 0 : Math.max(0, Math.min(1, (READ_LINE - ta) / (tb - ta)));
          // Hold the milestone's own week while its copy is being read, then
          // travel to the next one over the back half of the block. A plain
          // linear ramp had the counter showing week 16 while the paragraph on
          // screen was still describing week 12.
          // A 42% hold kept the number pinned to the milestone for nearly half
          // the block, then raced through the rest — which skipped whole weeks
          // (9, 22, 25, 30, 34, 36, 38 never appeared). A short 15% hold keeps
          // the number honest against the copy while leaving enough scroll for
          // every single week to be shown on the way past.
          const t = Math.max(0, Math.min(1, (raw - 0.15) / 0.85));
          const f = t * t * (3 - 2 * t);
          w = MILESTONES[i].w + (MILESTONES[i + 1].w - MILESTONES[i].w) * f;
        }
      }
      // Quarter-week steps. Half-weeks were coarse enough to see the figure
      // jump; quarters plus the CSS transition on `.fs-scale` read as one
      // continuous growth. Every whole week is passed through on the way — the
      // journey is ~4800px of scroll for 36 weeks, so no week is skipped.
      const q = Math.round(w * 5) / 5;
      setWeek((p) => (p === q ? p : q));
    };

    const schedule = () => { if (!tick) { tick = true; requestAnimationFrame(apply); } };
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule, { passive: true });
    apply();
    return () => { removeEventListener("scroll", schedule); removeEventListener("resize", schedule); };
  }, []);

  const shown = Math.round(week);
  const d = weekData(shown);
  const pct = Math.max(0, Math.min(1, (week - 4) / 36));

  return (
    <section className="pj" id="journey">
      <div className="wrap">
        <div className="pj-grid">
          <div className="pj-art">
            <div className="pj-card">
              <div className="pj-fig">
                <FetalStageArt week={week} uid="pj" cap={false} note=" " />
              </div>
              <div className="pj-meta">
                <b>{tr("Week")} {shown}</b>
                <span>{d ? tr(d.size) : ""}</span>
                <em>{d && d.len !== "—" ? `${d.len} · ${d.wt}` : tr("Too early to measure")}</em>
              </div>

              {/* the rail is the journey: trimester bands, a filled track and a
                  marker that sits exactly where the copy has got to */}
              <div className="pj-rail" aria-hidden="true">
                <div className="pj-track">
                  <i style={{ transform: `scaleX(${pct.toFixed(3)})` }} />
                  <b style={{ left: `${(pct * 100).toFixed(1)}%` }} />
                </div>
                <div className="pj-tri">
                  {TRIMESTERS.map((tri) => (
                    <span key={tri.n} className={trimesterOf(shown) === tri.n ? "on" : ""}>
                      {tr(tri.label)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <ScanToggle className="pj-toggle" />
            <InfoNote kind="size" />
          </div>

          <div className="pj-steps">
            {MILESTONES.map((m, i) => (
              <article
                key={m.w}
                ref={(el) => { stepRefs.current[i] = el; }}
                className={`pj-step rv${i === live ? " live" : ""}`}
              >
                <div className="pj-num"><i>{String(i + 1).padStart(2, "0")}</i><span /></div>
                <span className="eyebrow">{tr(m.eyebrow)}</span>
                <h3>{tr(m.title)}</h3>
                <p className="lede">{tr(m.body)}</p>
                <ul className="j-list">
                  {m.points.map((t) => (
                    <li key={t}><svg><use href="#i-check" /></svg>{tr(t)}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
