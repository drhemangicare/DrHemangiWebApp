"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * The design's ambient/scroll behaviours, ported from the original single-file
 * build's IIFEs. They all operate on class names rather than component state
 * (`.rv` → `.in`, `.wd i` → `.up`, `[data-num]`, `.prog`), so keeping them as
 * one DOM-level effect layer means the stylesheet stayed byte-identical while
 * the markup moved into React.
 *
 * Re-runs on every route change so newly mounted pages get observed too.
 */
export function SiteEffects() {
  const pathname = usePathname();

  /* ── reveal-on-scroll ──────────────────────────────────────────────────
     `.rv` blocks are VISIBLE by default (see the long note in site.css — that
     default is load-bearing and must not be flipped back). This effect arms
     the entrance animation by hiding blocks that are still below the fold,
     then lets them transition back in as they approach.

     Arming only ever happens here, in an effect, and only to elements that are
     off-screen at the time. That is what keeps it invisible to the reader and
     invisible to React's hydration: an earlier version stamped the same kind
     of attribute from an inline script before hydration and broke it. */
  useEffect(() => {
    // Nothing to arm: the stylesheet already keeps everything visible and
    // still, so leave the DOM completely alone.
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const play = (el: Element) => { el.removeAttribute("data-pre"); io.unobserve(el); };

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) play(e.target); }),
      // Fire slightly BEFORE the block scrolls into view, and on the first
      // sliver of it rather than 12%. The old `threshold:.12` + `-8%` bottom
      // margin meant a tall block (the week explorer is ~1900px) had to be a
      // long way up the screen before it revealed, so the reader scrolled
      // through a screenful of empty blush waiting for content to appear.
      { threshold: 0.01, rootMargin: "0px 0px 12% 0px" }
    );

    /* Arm every block we have not judged yet. A block is armed only if it is
       still fully below the viewport: anything already on screen, or already
       scrolled past, stays exactly as the reader is seeing it. That covers
       both the first screenful on load (which must never be hidden — it holds
       the Largest Contentful Paint element) and the case where the reader has
       already scrolled several screens down before hydration, since the
       server-rendered page is scrollable long before React is listening.

       A WeakSet rather than a marker attribute, so judging a block leaves no
       trace in the DOM for React to disagree with. */
    const judged = new WeakSet<Element>();
    const arm = () => {
      document.querySelectorAll<HTMLElement>(".rv").forEach((el) => {
        if (judged.has(el)) return;
        judged.add(el);
        if (el.getBoundingClientRect().top >= innerHeight) {
          el.setAttribute("data-pre", "");
          io.observe(el);
        }
      });
    };
    arm();
    // Pages render their content in the same tick, but client components that
    // fetch (services list, availability) add nodes later.
    const mo = new MutationObserver(arm);
    mo.observe(document.body, { childList: true, subtree: true });

    /* Safety net. An IntersectionObserver reports what it manages to sample,
       not what happened: a fast flick, or an in-page anchor jump ("Find my
       week" leaps ~4000px down the pregnancy page), can carry an armed block
       past the reader without the observer ever firing. Measured on the old
       build: a 700px-per-frame scroll of the home page left 4 of 21 blocks
       hidden. Anything armed whose top edge has reached the bottom of the
       viewport is played outright, whatever the observer did or did not see.
       The query set empties as the page plays out, so this costs nothing once
       the reader is a screen or two in. */
    let queued = false;
    const sweep = () => {
      document.querySelectorAll<HTMLElement>(".rv[data-pre]").forEach((el) => {
        if (el.getBoundingClientRect().top < innerHeight) play(el);
      });
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; sweep(); });
    };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      // Never leave a block hidden behind on unmount.
      document.querySelectorAll(".rv[data-pre]").forEach((el) => el.removeAttribute("data-pre"));
    };
  }, [pathname]);

  // ── word-by-word heading reveal (.wd i → .up) ────────────────────────────
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = Array.from(document.querySelectorAll<HTMLElement>(".head h2, .fert-grid h2, .band h2"));
    targets.forEach((h) => {
      if (h.dataset.split) return;
      h.dataset.split = "1";
      const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
      const nodes: Node[] = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach((n) => {
        if (!n.nodeValue?.trim()) return;
        const frag = document.createDocumentFragment();
        n.nodeValue.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) {
            frag.appendChild(document.createTextNode(" "));
            return;
          }
          const sp = document.createElement("span");
          sp.className = "wd";
          const it = document.createElement("i");
          it.textContent = tok;
          sp.appendChild(it);
          frag.appendChild(sp);
        });
        n.parentNode?.replaceChild(frag, n);
      });
    });
    const wo = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          wo.unobserve(e.target);
          e.target.querySelectorAll<HTMLElement>(".wd i").forEach((wd, k) => {
            wd.style.transitionDelay = k * 40 + "ms";
            wd.classList.add("up");
          });
        }),
      { threshold: 0.2 }
    );
    targets.forEach((h) => wo.observe(h));
    return () => wo.disconnect();
  }, [pathname]);

  // ── count-up stats ───────────────────────────────────────────────────────
  useEffect(() => {
    const ob = new IntersectionObserver(
      (es, o) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          o.unobserve(e.target);
          const el = e.target as HTMLElement;
          const to = parseFloat(el.dataset.num || "0");
          const suf = el.dataset.suf || "";
          const dec = to % 1 !== 0 ? 1 : 0;
          const t0 = performance.now();
          const D = 1600;
          const step = (now: number) => {
            const k = Math.min(1, (now - t0) / D);
            const v = to * (1 - Math.pow(1 - k, 3));
            el.textContent = (dec ? v.toFixed(1) : Math.round(v).toLocaleString("en-IN")) + (k === 1 ? suf : "");
            if (k < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }),
      { threshold: 0.4 }
    );
    document.querySelectorAll("[data-num]").forEach((el) => ob.observe(el));
    return () => ob.disconnect();
  }, [pathname]);

  // ── pointer tilt on cards ────────────────────────────────────────────────
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (matchMedia("(pointer:coarse)").matches) return;
    // `.cred` (the small MBBS/DNB/FMAS credential rows on the About page)
    // used to be in this list too. On a dense grid of small rows the same
    // tilt+lift built for the larger `.svc`/`.step`/`.fs` cards read as the
    // card twitching under the pointer rather than responding to it — it
    // stays static now, the way a compact info row should.
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".svc, .step, .fs"));
    const onMove = (e: PointerEvent) => {
      const card = e.currentTarget as HTMLElement;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg) translateY(-6px)`;
    };
    const onLeave = (e: PointerEvent) => {
      (e.currentTarget as HTMLElement).style.transform = "";
    };
    cards.forEach((c) => {
      c.style.transformStyle = "preserve-3d";
      c.addEventListener("pointermove", onMove as EventListener);
      c.addEventListener("pointerleave", onLeave as EventListener);
    });
    return () =>
      cards.forEach((c) => {
        c.removeEventListener("pointermove", onMove as EventListener);
        c.removeEventListener("pointerleave", onLeave as EventListener);
      });
  }, [pathname]);

  return null;
}

/** Fixed scroll-progress bar. */
export function ScrollProgress() {
  useEffect(() => {
    const bar = document.getElementById("prog");
    if (!bar) return;

    /* `scrollHeight` is measured here, NOT inside the scroll handler.
       Reading it forces the browser to flush layout, so doing it per frame
       meant a synchronous layout on every scroll frame — 120 of them a second
       on a 120Hz screen, for a 2px bar. The page height only changes when
       content or the viewport changes, so it is cached and refreshed on resize
       and whenever a reveal animation finishes changing the layout. */
    let max = 1;
    const measure = () => { max = Math.max(1, document.documentElement.scrollHeight - innerHeight); };

    let tick = false;
    const upd = () => {
      tick = false;
      // scaleX, not width — composited, so this never touches layout either.
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, scrollY / max))})`;
    };
    const onScroll = () => {
      if (!tick) { tick = true; requestAnimationFrame(upd); }
    };
    const onResize = () => { measure(); onScroll(); };

    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onResize, { passive: true });
    /* The reveal animations change the document height as they run, and images
       and fonts settle after first paint, so re-measure a few times early
       rather than trusting one reading taken before any of that happened. */
    const ro = new ResizeObserver(onResize);
    ro.observe(document.documentElement);
    measure(); upd();
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, []);
  return <div className="prog" id="prog" />;
}

/** Drifting particle field behind the whole site. */
export function Ambient() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = document.getElementById("cv") as HTMLCanvasElement | null;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let W = 0, H = 0, raf = 0, t = 0;
    const STEP_MS = 1000 / 30;          // see "the frame budget" below
    let parts: any[] = [], blobs: any[] = [];
    const COL = [[242, 201, 196], [201, 168, 124], [231, 213, 188], [227, 167, 162]];
    function size() {
      const d = Math.min(devicePixelRatio || 1, 2);
      W = cv!.width = innerWidth * d;
      H = cv!.height = innerHeight * d;
      cv!.style.width = innerWidth + "px";
      cv!.style.height = innerHeight + "px";
      const n = innerWidth < 700 ? 18 : 38;
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 2.4 + 0.6) * d,
        vx: (Math.random() - 0.5) * 0.16 * d, vy: -(Math.random() * 0.24 + 0.06) * d,
        a: Math.random() * 0.42 + 0.08, c: COL[(Math.random() * COL.length) | 0], ph: Math.random() * 6.28,
      }));
      blobs = Array.from({ length: 4 }, (_, i) => {
        const r = (160 + Math.random() * 220) * d;
        const c = COL[i % COL.length], a = 0.055;
        /* The gradient is built ONCE per blob, centred on the origin, and the
           canvas is translated to place it. It used to be rebuilt every frame:
           `createRadialGradient` allocates and recompiles a gradient each call,
           so four blobs at 120Hz meant 480 allocations a second for four
           pictures that never actually change. */
        const g = ctx!.createRadialGradient(0, 0, 0, 0, 0, r);
        g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${a})`);
        g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
        return {
          x: Math.random() * W, y: Math.random() * H, r,
          vx: (Math.random() - 0.5) * 0.14 * d, vy: (Math.random() - 0.5) * 0.14 * d, c, a, g,
        };
      });
    }
    function paint() {
      ctx!.clearRect(0, 0, W, H);
      t += 0.006 * (STEP_MS / 16.67);   // drift speed stays the same in real time
      blobs.forEach((b) => {
        b.x += b.vx; b.y += b.vy;
        if (b.x < -b.r || b.x > W + b.r) b.vx *= -1;
        if (b.y < -b.r || b.y > H + b.r) b.vy *= -1;
        ctx!.save();
        ctx!.translate(b.x, b.y);
        ctx!.fillStyle = b.g;
        ctx!.beginPath(); ctx!.arc(0, 0, b.r, 0, 6.2832); ctx!.fill();
        ctx!.restore();
      });
      parts.forEach((p) => {
        p.x += p.vx + Math.sin(t + p.ph) * 0.14;
        p.y += p.vy;
        if (p.y < -14) { p.y = H + 14; p.x = Math.random() * W; }
        if (p.x < -14) p.x = W + 14;
        if (p.x > W + 14) p.x = -14;
        const tw = p.a * (0.62 + 0.38 * Math.sin(t * 2.4 + p.ph));
        ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx!.fillStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${tw})`;
        ctx!.fill();
      });
    }

    /* THE FRAME BUDGET — this is what makes a 120Hz screen feel smooth.
       This canvas is a slow decorative drift: four soft blobs and a few dozen
       motes, over the whole viewport at up to 2x device pixel ratio. Painting
       it is fill-rate heavy, and it used to run on every animation frame
       forever. On a 120Hz display that is 120 full-viewport repaints a second
       spent on something nobody is looking at — and it is main-thread work, so
       it competes directly with scrolling and with the CSS transitions that
       DO need every frame.
       Drawing it at ~30fps is indistinguishable (the motion is this slow on
       purpose) and leaves the other three-quarters of every 120Hz frame budget
       free for the things the reader actually perceives. */
    let last = 0;
    function draw(now: number) {
      raf = requestAnimationFrame(draw);
      if (now - last < STEP_MS) return;
      last = now;
      paint();
    }
    size(); paint(); raf = requestAnimationFrame(draw);
    let rt: any;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(size, 180); };
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else { last = 0; raf = requestAnimationFrame(draw); }
    };
    addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <>
      <div className="aura" />
      <div id="ambient"><canvas id="cv" /></div>
      <div className="grain" />
    </>
  );
}
