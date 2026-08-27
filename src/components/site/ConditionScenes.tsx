import type { Condition } from "@/lib/site/conditions";

/**
 * Explanatory scenes for the condition pages.
 *
 * The hero illustration shows a patient *what the thing is*. These show her
 * *how it behaves* — the loop PCOS runs in, where endometriosis lands, what a
 * test is actually looking for, what "next line of treatment" means. They sit
 * between the text sections so that someone who reads nothing at all still
 * comes away with the shape of it.
 *
 * Two layout rules learned the hard way here:
 *   1. The long caption lives in HTML under the figure, not in a <text> node.
 *      Inside the SVG it cannot wrap, so on a 350-unit box it ran off both
 *      sides at every viewport.
 *   2. Labels inside the drawing are kept short and given their own vertical
 *      lanes. Two labels on the same baseline will collide the moment the font
 *      is anything but tiny.
 *
 * Same rules as everywhere else: one shared gradient language, per-instance
 * gradient ids, and every animation switched off under prefers-reduced-motion.
 */

const LINE = "#9A5A57";

function SceneDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`sk${uid}`} x1=".1" y1="0" x2=".9" y2="1">
        <stop offset="0" stopColor="#FFF6F3" />
        <stop offset=".45" stopColor="#F7D3CC" />
        <stop offset="1" stopColor="#DA9A92" />
      </linearGradient>
      <linearGradient id={`gd${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F0DCBB" />
        <stop offset=".5" stopColor="#C9A87C" />
        <stop offset="1" stopColor="#A5834E" />
      </linearGradient>
      <radialGradient id={`gl${uid}`} cx=".42" cy=".36" r=".62">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset=".35" stopColor="#FFDCD6" />
        <stop offset="1" stopColor="#F08C85" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`bl${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#E68C86" />
        <stop offset="1" stopColor="#B84C50" />
      </linearGradient>
    </defs>
  );
}

/* ── PCOS · the loop it runs in ──────────────────────────────────────────── */
/** Visible arc, as a percentage of the ring (pathLength is normalised to 100). */
const LOOP_ARC = 13;

function LoopScene({ uid }: { uid: string }) {
  const cx = 175, cy = 104, R = 60;
  const nodes = [
    { a: -90, t: "Insulin runs high", s: "the body stops listening", pos: "top" },
    { a: 0, t: "More androgen", s: "testosterone rises", pos: "right" },
    { a: 90, t: "Follicles pause", s: "none takes the lead", pos: "bottom" },
    { a: 180, t: "Ovulation skipped", s: "so the period is late", pos: "left" },
  ] as const;
  return (
    <>
      <circle cx={cx} cy={cy} r={R + 16} fill={`url(#gl${uid})`} opacity=".26" />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#E9CFC9" strokeWidth="11" />
      {/* The travelling arc. `pathLength={100}` normalises the circle to 100
          units, so the dash and gap are simply percentages that sum to 100 and
          the shared keyframe travels exactly -100 — one clean revolution per
          cycle, seamless whatever the radius. See the note in site.css. */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={`url(#gd${uid})`} strokeWidth="11"
        pathLength={100} strokeDasharray={`${LOOP_ARC} ${100 - LOOP_ARC}`}
        strokeLinecap="round" className="an-loop" />
      {nodes.map((n, i) => {
        const rad = (n.a * Math.PI) / 180;
        const x = cx + Math.cos(rad) * R, y = cy + Math.sin(rad) * R;
        const anchor = n.pos === "right" ? "start" : n.pos === "left" ? "end" : "middle";
        const tx = n.pos === "right" ? x + 18 : n.pos === "left" ? x - 18 : x;
        // Clearance from each node's own 10-radius dot, not just from its
        // neighbours: the top label's second line used to dip into the node
        // it belongs to (the dot sits at the same x, only 22 units below the
        // tag's baseline, and the sub-line's descender reached past that).
        const ty = n.pos === "top" ? y - 32 : n.pos === "bottom" ? y + 28 : y - 6;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="10" fill="#fff" stroke={LINE} strokeWidth="1.3" strokeOpacity=".5" />
            <circle cx={x} cy={y} r="5" fill={`url(#gd${uid})`} className="an-spot" style={{ animationDelay: `${i * 0.9}s` }} />
            <text x={tx} y={ty} textAnchor={anchor} className="an-tag">{n.t}</text>
            <text x={tx} y={ty + 14} textAnchor={anchor} className="an-sub">{n.s}</text>
          </g>
        );
      })}
      <text x={cx} y={cy + 1} textAnchor="middle" className="an-label">The loop</text>
      <text x={cx} y={cy + 17} textAnchor="middle" className="an-sub">it feeds itself</text>
    </>
  );
}

/* ── Endometriosis · where it lands ──────────────────────────────────────── */
function MapScene({ uid }: { uid: string }) {
  const sites = [
    { x: 104, y: 82, r: 8, t: "Ovary", dy: -18 },
    { x: 246, y: 82, r: 8, t: "Ovary", dy: -18 },
    { x: 175, y: 146, r: 9, t: "Behind the uterus", dy: 24 },
    { x: 112, y: 132, r: 6, t: "Bladder", dy: 20 },
    { x: 240, y: 132, r: 6, t: "Bowel", dy: 20 },
  ];
  return (
    <>
      <ellipse cx="175" cy="104" rx="140" ry="82" fill="#fff" opacity=".45" />
      <path d="M84 46c16 24 24 50 22 74-2 20-12 34-26 44" fill="none" stroke={LINE} strokeWidth="2" strokeOpacity=".26" />
      <path d="M266 46c-16 24-24 50-22 74 2 20 12 34 26 44" fill="none" stroke={LINE} strokeWidth="2" strokeOpacity=".26" />
      <path d="M175 46c-16 0-27 9-30 24-3 13-1 28 4 40 5 11 13 18 26 18s21-7 26-18c5-12 7-27 4-40-3-15-14-24-30-24z"
        fill={`url(#sk${uid})`} stroke={LINE} strokeWidth="1.4" strokeOpacity=".5" />
      {sites.map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r={s.r + 7} fill="#C4576B" opacity=".12"
            className="an-spot" style={{ animationDelay: `${i * 0.4}s` }} />
          <circle cx={s.x} cy={s.y} r={s.r} fill="#B4485C" opacity=".6"
            className="an-spot" style={{ animationDelay: `${i * 0.4}s` }} />
          <text x={s.x} y={s.y + s.dy} textAnchor="middle" className="an-sub">{s.t}</text>
        </g>
      ))}
    </>
  );
}

/* ── Fibroids · size is not the point ────────────────────────────────────── */
function GrowthScene({ uid }: { uid: string }) {
  const sizes = [
    { x: 72, r: 14, t: "Pea", s: "1 cm" },
    { x: 175, r: 28, t: "Plum", s: "4 cm" },
    { x: 284, r: 46, t: "Grapefruit", s: "10 cm" },
  ];
  return (
    <>
      {sizes.map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy="94" r={s.r + 9} fill={`url(#gl${uid})`} opacity=".3" />
          <circle cx={s.x} cy="94" r={s.r} fill={`url(#gd${uid})`} className="an-nodule"
            style={{ animationDelay: `${i * 0.8}s` }} />
          <circle cx={s.x - s.r * 0.3} cy={94 - s.r * 0.34} r={s.r * 0.25} fill="#fff" opacity=".4" />
          <text x={s.x} y="164" textAnchor="middle" className="an-tag">{s.t}</text>
          <text x={s.x} y="180" textAnchor="middle" className="an-sub">{s.s}</text>
        </g>
      ))}
      <line x1="26" y1="148" x2="324" y2="148" stroke="#E9CFC9" strokeWidth="2" strokeLinecap="round" />
    </>
  );
}

/* ── Irregular periods · what a tracked cycle shows ──────────────────────── */
function CalendarScene({ uid }: { uid: string }) {
  const rows = [
    { ds: [0, 28, 56, 84, 112], y: 54, t: "A regular pattern", gold: true },
    { ds: [0, 24, 71, 96, 158], y: 130, t: "Worth investigating", gold: false },
  ];
  return (
    <>
      {rows.map((r, ri) => (
        <g key={ri}>
          <line x1="40" y1={r.y} x2="310" y2={r.y} stroke="#E9CFC9" strokeWidth="3" strokeLinecap="round" />
          {r.ds.map((d, i) => (
            <g key={i}>
              <circle cx={40 + (d / 170) * 270} cy={r.y} r="8"
                fill={r.gold ? `url(#gd${uid})` : `url(#bl${uid})`}
                className="an-spot" style={{ animationDelay: `${i * 0.3}s` }} />
              {i > 0 && (
                <text x={40 + ((r.ds[i - 1] + d) / 2 / 170) * 270} y={r.y - 14} textAnchor="middle" className="an-sub">
                  {d - r.ds[i - 1]}d
                </text>
              )}
            </g>
          ))}
          <text x="40" y={r.y + 26} className="an-tag">{r.t}</text>
        </g>
      ))}
      <text x="310" y="80" textAnchor="end" className="an-sub">21–35 days, predictable</text>
      <text x="310" y="156" textAnchor="end" className="an-sub">gaps that swing, or over 35 days</text>
    </>
  );
}

/* ── Difficulty conceiving · four things that all have to work ───────────── */
function PathScene({ uid }: { uid: string }) {
  const gates = [
    { t: "Egg released", s: "cycle & hormones" },
    { t: "Tubes open", s: "tubal test" },
    { t: "Healthy sperm", s: "semen analysis" },
    { t: "Lining ready", s: "scan & timing" },
  ];
  return (
    <>
      <line x1="46" y1="84" x2="304" y2="84" stroke="#E9CFC9" strokeWidth="4" strokeLinecap="round" />
      <line x1="46" y1="84" x2="304" y2="84" stroke={`url(#gd${uid})`} strokeWidth="4" strokeLinecap="round"
        pathLength={100} strokeDasharray="14 86" className="an-run" />
      {gates.map((g, i) => {
        const x = 46 + i * 86;
        return (
          <g key={i}>
            <circle cx={x} cy="84" r="17" fill="#fff" stroke={LINE} strokeWidth="1.3" strokeOpacity=".45" />
            <circle cx={x} cy="84" r="9" fill={`url(#gd${uid})`} className="an-spot" style={{ animationDelay: `${i * 0.7}s` }} />
            <text x={x} y="89" textAnchor="middle" className="an-num">{i + 1}</text>
            <text x={x} y="130" textAnchor="middle" className="an-tag">{g.t}</text>
            <text x={x} y="146" textAnchor="middle" className="an-sub">{g.s}</text>
          </g>
        );
      })}
    </>
  );
}

/* ── Recurrent loss · deliberately gentle ────────────────────────────────── */
function HopeScene({ uid }: { uid: string }) {
  const stops = [
    { x: 68, y: 100, t: "Investigate", s: "clotting · thyroid · uterus" },
    { x: 175, y: 116, t: "Treat what is found", s: "and support what isn't" },
    { x: 284, y: 84, t: "Try again", s: "early scans, close contact" },
  ];
  return (
    <>
      <path d="M46 112C92 78 128 148 175 116s108 18 130-30" fill="none" stroke="#E9CFC9" strokeWidth="4"
        strokeLinecap="round" strokeDasharray="2 10" />
      {stops.map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r="20" fill={`url(#gl${uid})`} className="an-breathe" style={{ animationDelay: `${i * 1.1}s` }} />
          <circle cx={s.x} cy={s.y} r="7" fill={`url(#gd${uid})`} />
          <text x={s.x} y="164" textAnchor="middle" className="an-tag">{s.t}</text>
          <text x={s.x} y="180" textAnchor="middle" className="an-sub">{s.s}</text>
        </g>
      ))}
    </>
  );
}

/* ── shared · what the tests actually do ─────────────────────────────────
   Cards, not one big SVG. Wording inside a scaled SVG cannot wrap: at a
   940px-wide figure the 350-unit box scales ~2.7×, so "only if it changes the
   plan" ran clean out of its panel and over the drawing next to it. Pictures
   stay in fixed-ratio SVGs; every word lives in HTML and wraps like text. */

function VialIcon({ uid }: { uid: string }) {
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label="A blood sample tube">
      <SceneDefs uid={uid} />
      <clipPath id={`clip${uid}`}>
        <rect x="44" y="26" width="32" height="76" rx="16" />
      </clipPath>
      <rect x="44" y="26" width="32" height="76" rx="16" fill="#fff" stroke={LINE} strokeWidth="2" strokeOpacity=".38" />
      {/* the liquid is clipped to the tube, so the fill animation can never
          slide out from under it — which is exactly what it used to do */}
      <g clipPath={`url(#clip${uid})`}>
        <rect x="42" y="56" width="36" height="60" fill={`url(#bl${uid})`} className="an-fill" />
      </g>
      <rect x="38" y="18" width="44" height="11" rx="5" fill={`url(#gd${uid})`} />
      <rect x="52" y="34" width="7" height="30" rx="4" fill="#fff" opacity=".55" />
      <path d="M94 44c5 7 8 12 8 16a8 8 0 0 1-16 0c0-4 3-9 8-16z" fill={`url(#bl${uid})`} opacity=".7"
        className="an-breathe" />
    </svg>
  );
}

function ScanIcon({ uid }: { uid: string }) {
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label="An ultrasound probe on a rounded abdomen">
      <SceneDefs uid={uid} />
      {/* the belly — the thing that makes this read as a scan and not a wifi symbol */}
      <path d="M14 104c0-30 18-52 46-52s46 22 46 52z" fill={`url(#sk${uid})`} stroke={LINE} strokeWidth="2" strokeOpacity=".35" />
      <circle cx="60" cy="92" r="4" fill={LINE} opacity=".3" />
      {/* beam */}
      <g className="an-sweep" style={{ transformOrigin: "60px 44px" }}>
        <path d="M60 44 34 92a52 52 0 0 0 52 0z" fill={`url(#gl${uid})`} opacity=".75" />
      </g>
      <rect x="49" y="16" width="22" height="30" rx="9" fill="#4A1F35" />
      <rect x="53" y="21" width="6" height="14" rx="3" fill="#fff" opacity=".3" />
      <circle cx="60" cy="74" r="7" fill="#fff" opacity=".75" className="an-spot" />
    </svg>
  );
}

function CameraIcon({ uid }: { uid: string }) {
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label="A keyhole camera and its light">
      <SceneDefs uid={uid} />
      <circle cx="62" cy="64" r="34" fill="#fff" stroke={LINE} strokeWidth="2" strokeOpacity=".35" />
      <circle cx="62" cy="64" r="34" fill="none" stroke={`url(#gd${uid})`} strokeWidth="4"
        pathLength={100} strokeDasharray="16 84" strokeLinecap="round" className="an-loop" />
      <circle cx="62" cy="64" r="15" fill={`url(#gl${uid})`} className="an-breathe" />
      <circle cx="62" cy="64" r="6" fill="#4A1F35" opacity=".7" />
      <rect x="16" y="18" width="13" height="34" rx="6" fill="#4A1F35"
        transform="rotate(-38 22 35)" />
      <path d="M31 46 46 58" stroke={LINE} strokeWidth="3" strokeLinecap="round" strokeOpacity=".5" />
    </svg>
  );
}

const TESTS = [
  { Icon: VialIcon, k: "v", t: "A blood test", d: "Hormones, thyroid and iron — the numbers no scan can show." },
  { Icon: ScanIcon, k: "s", t: "An ultrasound", d: "The shape of the uterus, the thickness of the lining, and the follicles on each ovary." },
  { Icon: CameraIcon, k: "c", t: "A camera, sometimes", d: "A keyhole look inside, offered only when it would change the plan." },
];

export function TestsIllustration({ uid = "t" }: { uid?: string }) {
  return (
    <div className="pic-set">
      <div className="pic-grid">
        {TESTS.map(({ Icon, k, t, d }) => (
          <figure className="pic" key={k}>
            <div className="pic-art"><Icon uid={`t${uid}${k}`} /></div>
            <figcaption>
              <b>{t}</b>
              <span>{d}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="pic-note">
        Not everyone needs all three. Each answers a different question — which is why a test you were not offered is
        often the right call.
      </p>
    </div>
  );
}

/* ── shared · the treatment ladder ───────────────────────────────────────── */

const RUNGS = [
  { t: "Start simple", d: "Lifestyle, pain relief, or a tablet — whatever is least disruptive to your life." },
  { t: "Add if needed", d: "A hormonal option or a longer course, if the first step has not settled things." },
  { t: "A procedure", d: "Day-case surgery when medicine cannot fix the structure causing the problem." },
  { t: "Specialist route", d: "Fertility treatment or a referral, planned with you rather than sprung on you." },
];

export function LadderIllustration({ uid = "l" }: { uid?: string }) {
  return (
    <div className="pic-set">
      {/* the staircase reads the idea in one glance; the rows below say it in
          words. A per-row bar did neither — four pale blocks in four separate
          rows never look like one rising set of steps. */}
      <div className="lad-stair" aria-hidden="true">
        {RUNGS.map((r, i) => (
          <span key={r.t} style={{ height: `${30 + i * 20}px`, animationDelay: `${i * 0.55}s` }}>{i + 1}</span>
        ))}
      </div>
      <ol className="lad">
        {RUNGS.map((r, i) => (
          <li key={r.t}>
            <span className="lad-n" aria-hidden="true">{i + 1}</span>
            <span className="lad-tx">
              <b>{r.t}</b>
              <span>{r.d}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="pic-note">
        You move up a rung only if the one below it has not done the job — and you can stop at any step you are happy
        with.
      </p>
    </div>
  );
}

type SceneDef = { C: (p: { uid: string }) => React.JSX.Element; vb: string; cap: string };

const SCENES: Record<Condition["art"], SceneDef> = {
  ovary: {
    /* Framed from the *labels*, not the ring. The four captions stick out well
       past the circle, and the right-hand pair ("testosterone rises") is the
       widest; a box drawn around the ring alone clipped it the moment the
       self-hosted font rendered a hair wider than the old webfont. Kept
       symmetric about the ring's centre (x=175) with room to spare, so a
       future wording or font change has somewhere to go. */
    C: LoopScene, vb: "-8 -6 366 219",
    cap: "PCOS is a loop, not a lump. Treatment works by breaking it at whichever point is easiest for you — not by removing cysts.",
  },
  endometriosis: {
    C: MapScene, vb: "27 14 296 180",
    cap: "Each deposit responds to your cycle and bleeds, with nowhere for the blood to go. That is why the pain is cyclical, and why it can be felt far from the uterus.",
  },
  fibroids: {
    C: GrowthScene, vb: "18 31 329 159",
    cap: "A pea sitting inside the cavity can bleed far more than a grapefruit on the outer wall. Position matters more than size.",
  },
  cycle: {
    C: CalendarScene, vb: "24 24 294 143",
    cap: "Three tracked months tell a doctor more than any single blood test. Note the first day of every period and bring the list.",
  },
  fertility: {
    C: PathScene, vb: "0 59 342 97",
    cap: "Four things all have to work. One round of tests — for both partners, usually inside a single cycle — checks all four.",
  },
  shield: {
    C: HopeScene, vb: "8 56 339 134",
    cap: "Most couples who investigate go on to have a baby. Nothing you did caused this.",
  },
};

/** The condition-specific "how it behaves" scene. */
export function ConditionScene({ kind, uid = kind }: { kind: Condition["art"]; uid?: string }) {
  const { C, vb, cap } = SCENES[kind];
  return (
    <figure className="expl">
      <svg viewBox={vb} role="img" aria-label={cap}>
        <SceneDefs uid={`s${uid}`} />
        <C uid={`s${uid}`} />
      </svg>
      <figcaption>{cap}</figcaption>
    </figure>
  );
}
