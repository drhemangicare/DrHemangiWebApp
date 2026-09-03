"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FigureStage } from "./FigureStage";
import { useCare } from "./Care";
import { CHAPTERS } from "@/lib/site/figures";

const PHASE_MS = 7200;

const CAPTIONS = [
  "learning what your own body is telling you.",
  "trying, and needing a real plan instead of waiting.",
  "growing a whole person, one week at a time.",
  "finding your way back to yourself.",
];

export function Hero({ years, deliveries }: { years: number; deliveries: number }) {
  const { care, copy } = useCare();
  const bookingOn = care.booking;
  const [phase, setPhase] = useState(0);
  const hudRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inView = useRef(true);

  const advance = useCallback((n: number) => setPhase(((n % 4) + 4) % 4), []);

  // ── auto-advance, paused while the hero is off screen ───────────────────
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tick = () => {
      if (inView.current) setPhase((p) => (p + 1) % 4);
      timer.current = setTimeout(tick, PHASE_MS);
    };
    timer.current = setTimeout(tick, PHASE_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => { inView.current = e[0].isIntersecting; }, { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ── keep the live chapter pill centred in the strip ─────────────────────
  // This used to fire only on a manual tap, so on a phone (where the four
  // pills overflow) the highlighted chapter sat off-screen while the
  // illustration behind it had already moved on.
  useEffect(() => {
    const h = hudRef.current;
    if (!h) return;
    const cur = h.children[phase] as HTMLElement | undefined;
    if (!cur) return;
    if (h.scrollWidth > h.clientWidth + 4) {
      h.scrollTo({
        left: Math.max(0, cur.offsetLeft - (h.clientWidth - cur.offsetWidth) / 2),
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    }
  }, [phase]);

  // ── pointer parallax on the rig ─────────────────────────────────────────
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (matchMedia("(pointer:coarse)").matches) return;
    const tilt = tiltRef.current;
    if (!tilt) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, run = false, raf = 0;
    const loop = () => {
      cx += (tx - cx) * 0.055;
      cy += (ty - cy) * 0.055;
      tilt.style.transform = `rotateY(${cx * 11}deg) rotateX(${-cy * 9}deg) translate3d(${cx * 16}px,${cy * 12}px,0)`;
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(loop);
      else run = false;
    };
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / innerWidth - 0.5) * 2;
      ty = (e.clientY / innerHeight - 0.5) * 2;
      if (!run) { run = true; raf = requestAnimationFrame(loop); }
    };
    addEventListener("pointermove", onMove, { passive: true });
    return () => { removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);

  // ── hero dust field (disabled on phones: per-frame canvas work is the most
  //    expensive thing on the page and the medallion is tiny there) ────────
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (matchMedia("(max-width:760px)").matches) return;
    const cv = document.getElementById("dust") as HTMLCanvasElement | null;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    let W = 0, H = 0, dpr = 1, P: any[] = [], raf = 0, t = 0, live = true;
    const COL = ["242,201,196", "201,168,124", "231,213,188", "227,167,162", "255,255,255"];
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.width = Math.max(1, cv.clientWidth * dpr);
      H = cv.height = Math.max(1, cv.clientHeight * dpr);
      P = Array.from({ length: 96 }, () => ({
        x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() * 2 - 1,
        r: Math.random() * 2.4 + 0.6, c: COL[(Math.random() * COL.length) | 0],
        a: Math.random() * 0.46 + 0.14, sp: Math.random() * 0.7 + 0.4, ph: Math.random() * 6.28,
      }));
    };
    const draw = () => {
      if (!live) { raf = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);
      t += 0.0016;
      const cx = W * 0.5, cy = H * 0.5, F = 2.1, S = Math.min(W, H) * 0.66;
      const ct = Math.cos(t * 1.6), st = Math.sin(t * 1.6);
      for (const p of P) {
        p.y -= 0.0011 * p.sp;
        if (p.y < -1.2) p.y = 1.2;
        const x = p.x * ct - p.z * st, z = p.x * st + p.z * ct;
        const f = F / (F + z + 1.25);
        const sx = cx + x * S * f, sy = cy + p.y * S * f, r = Math.max(0.35, p.r * f * dpr * 1.35);
        const a = p.a * Math.min(1, f * 0.85) * (0.55 + 0.45 * Math.sin(t * 46 + p.ph));
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, 6.2832);
        ctx.fillStyle = `rgba(${p.c},${a.toFixed(3)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    size(); draw();
    let rt: any;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(size, 180); };
    addEventListener("resize", onResize);
    const io = new IntersectionObserver((e) => { live = e[0].isIntersecting; }, { threshold: 0 });
    io.observe(cv);
    const onVis = () => { if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(draw); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); removeEventListener("resize", onResize);
      io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <header className="hero" id="hero" ref={heroRef}>
      <div className="scene">
        <canvas className="scene-dust" id="dust" />
        <div className="scene-rig" id="rig">
          <div className="rig-tilt" id="tilt" ref={tiltRef}>
            <div className="orbits">
              <span className="orb-ring o2"><i /></span>
              <span className="orb-ring o1"><i /></span>
              <span className="orb-ring o3"><i /></span>
            </div>
            <div className="core-glow" />
            <FigureStage active={phase} uid="h" />
          </div>
        </div>
        <div className="scene-veil" />
      </div>

      <div className="hero-in">
        <div className="hero-copy">
          <div className="eyebrow fade-up">Women&apos;s Health, Reimagined</div>
          <h1>
            <span className="l"><i>Care that</i></span>
            <span className="l"><i>grows with</i></span>
            <span className="l"><i><span className="ital">every chapter</span></i></span>
          </h1>
          {/* The promise the hero makes has to match what the clinic is
              actually offering. "on video or in clinic" was hard-coded, so a
              clinic with both switches off still opened by promising both. */}
          <p className="lede fade-up">{copy.heroLede}</p>
          <div className="pcap fade-up" id="pcap">
            {CAPTIONS.map((c, i) => (
              <span key={i} className={i === phase ? "on" : undefined}>
                <b>Right now</b> — {c}
              </span>
            ))}
          </div>
          <div className="hero-btns fade-up">
            {bookingOn ? (
              <>
                <Link href="/book" className="btn btn-p btn-lg">
                  Book a consultation <svg><use href="#i-arr" /></svg>
                </Link>
                <Link href="/bookings" className="btn btn-g btn-lg">
                  <svg><use href="#i-cal" /></svg> My bookings
                </Link>
              </>
            ) : (
              /* With nothing bookable the hero still needs a primary action, or
                 the page has no route onward at all. Both buttons come from the
                 copy table so the pair differs by mode instead of always being
                 the same "Contact / What we treat". */
              <>
                <Link href={copy.heroPrimary.href} className="btn btn-p btn-lg">
                  {copy.heroPrimary.label} <svg><use href="#i-arr" /></svg>
                </Link>
                <Link href={copy.heroSecondary.href} className="btn btn-g btn-lg">
                  {copy.heroSecondary.label}
                </Link>
              </>
            )}
          </div>
          <div className="hero-trust fade-up">
            <div className="tr"><b data-num={years} data-suf="+">0</b><span>Years of experience</span></div>
            <div className="tr"><b data-num={deliveries} data-suf="+">0</b><span>Successful deliveries</span></div>
            <div className="tr"><b data-num="4.9" data-suf="★">0</b><span>Patient rating</span></div>
          </div>
        </div>
      </div>

      <div className="hud">
        <div className="hud-in" id="hud" ref={hudRef}>
          {CHAPTERS.map((c, i) => (
            <button key={c.key} className={`ph${i === phase ? " on" : ""}`} onClick={() => advance(i)}>
              <em>{c.eyebrow}</em>
              <b>{c.pill}</b>
              <span className="ph-bar" style={{ ["--dur" as string]: PHASE_MS / 1000 + "s" }}><i /></span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
