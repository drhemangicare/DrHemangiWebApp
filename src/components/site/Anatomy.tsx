import type { Condition } from "@/lib/site/conditions";

/**
 * Condition illustrations.
 *
 * Deliberately stylised rather than textbook-accurate: these are for a patient
 * who is frightened and googling, not for a clinician. They use the same
 * layered gradient language as the hero figures so the whole site reads as one
 * thing. Every animation is defined in site.css and switched off under
 * prefers-reduced-motion.
 *
 * Gradient ids are suffixed with a per-instance uid — two illustrations on one
 * page would otherwise steal each other's fills.
 */

function Defs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`tis${uid}`} x1=".15" y1="0" x2=".9" y2="1">
        <stop offset="0" stopColor="#FDE9E4" />
        <stop offset=".28" stopColor="#F8D2CB" />
        <stop offset=".62" stopColor="#E9A49D" />
        <stop offset="1" stopColor="#C4796F" />
      </linearGradient>
      <linearGradient id={`pale${uid}`} x1=".2" y1="0" x2=".85" y2="1">
        <stop offset="0" stopColor="#FFFAF8" />
        <stop offset=".45" stopColor="#F8DCD6" />
        <stop offset="1" stopColor="#E0A79F" />
      </linearGradient>
      <radialGradient id={`glow${uid}`} cx=".42" cy=".36" r=".62">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset=".3" stopColor="#FFDCD6" />
        <stop offset=".7" stopColor="#F08C85" stopOpacity=".45" />
        <stop offset="1" stopColor="#F08C85" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`gold${uid}`} cx=".4" cy=".34" r=".6">
        <stop offset="0" stopColor="#FFF6E6" />
        <stop offset=".5" stopColor="#DFBE8E" />
        <stop offset="1" stopColor="#A5834E" />
      </radialGradient>
      <radialGradient id={`halo${uid}`} cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#C9A87C" stopOpacity=".30" />
        <stop offset="1" stopColor="#C9A87C" stopOpacity="0" />
      </radialGradient>
      <filter id={`soft${uid}`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
    </defs>
  );
}

const LINE = "#9A5A57";
const LW = 1.5;
const LO = 0.62;

/** Uterus + tubes + ovaries, the base shape several diagrams build on. */
function UterusBody({ uid, showCavity = false }: { uid: string; showCavity?: boolean }) {
  return (
    <g>
      {/* body of the uterus */}
      <path
        d="M150 92c-30 0-52 16-58 44-5 24-2 52 8 74 9 20 24 32 50 32s41-12 50-32c10-22 13-50 8-74-6-28-28-44-58-44z"
        fill={`url(#tis${uid})`} stroke={LINE} strokeWidth={LW} strokeOpacity={LO}
      />
      {/* highlight */}
      <path d="M124 104c-16 8-26 22-30 42-4 20-2 44 5 62 3 8 7 14 12 19l14-123z" fill="#fff" opacity=".26" />
      {/* cervix */}
      <path d="M136 240h28v20c0 8-6 14-14 14s-14-6-14-14z" fill={`url(#pale${uid})`} stroke={LINE} strokeWidth={LW} strokeOpacity={LO} />
      {/* fallopian tubes */}
      <path d="M96 116c-18-14-38-18-54-8" fill="none" stroke={LINE} strokeWidth="6" strokeOpacity=".5" strokeLinecap="round" />
      <path d="M204 116c18-14 38-18 54-8" fill="none" stroke={LINE} strokeWidth="6" strokeOpacity=".5" strokeLinecap="round" />
      {/* ovaries */}
      <ellipse cx="38" cy="112" rx="20" ry="14" fill={`url(#pale${uid})`} stroke={LINE} strokeWidth={LW} strokeOpacity={LO} />
      <ellipse cx="262" cy="112" rx="20" ry="14" fill={`url(#pale${uid})`} stroke={LINE} strokeWidth={LW} strokeOpacity={LO} />
      {showCavity && (
        <path d="M150 112c-16 0-27 8-31 24-3 13-1 30 4 42h54c5-12 7-29 4-42-4-16-15-24-31-24z"
          fill="#FFF6F3" stroke={LINE} strokeWidth="1.1" strokeOpacity=".4" />
      )}
    </g>
  );
}

/* ── PCOS: a typical ovary beside a polycystic one ───────────────────────── */
function OvaryArt({ uid }: { uid: string }) {
  const pearls = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return { x: 228 + Math.cos(a) * 46, y: 130 + Math.sin(a) * 32, d: i * 0.18 };
  });
  return (
    <>
      <circle cx="80" cy="130" r="70" fill={`url(#halo${uid})`} />
      <circle cx="228" cy="130" r="78" fill={`url(#halo${uid})`} />

      {/* typical ovary — one dominant follicle */}
      <ellipse cx="80" cy="130" rx="58" ry="42" fill={`url(#pale${uid})`} stroke={LINE} strokeWidth={LW} strokeOpacity={LO} />
      <ellipse cx="62" cy="116" rx="24" ry="20" fill={`url(#glow${uid})`} className="an-breathe" />
      <circle cx="104" cy="146" r="5" fill="#EBC9C3" />
      <circle cx="96" cy="112" r="4" fill="#EBC9C3" />
      <text x="80" y="212" textAnchor="middle" className="an-label">Typical ovary</text>
      <text x="80" y="230" textAnchor="middle" className="an-sub">one follicle matures</text>

      {/* polycystic ovary — ring of small follicles */}
      <ellipse cx="228" cy="130" rx="64" ry="48" fill={`url(#pale${uid})`} stroke={LINE} strokeWidth={LW} strokeOpacity={LO} />
      {pearls.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="7.5" fill={`url(#glow${uid})`}
          className="an-pearl" style={{ animationDelay: `${p.d}s` }} />
      ))}
      <text x="228" y="212" textAnchor="middle" className="an-label">Polycystic ovary</text>
      <text x="228" y="230" textAnchor="middle" className="an-sub">many paused follicles</text>
    </>
  );
}

/* ── Endometriosis: deposits outside the uterus ──────────────────────────── */
function EndoArt({ uid }: { uid: string }) {
  const spots = [
    [58, 150, 9], [70, 196, 7], [232, 148, 8], [244, 190, 6],
    [110, 262, 7], [196, 268, 8], [150, 300, 6], [40, 92, 6], [262, 88, 5],
  ] as const;
  return (
    <>
      <circle cx="150" cy="180" r="130" fill={`url(#halo${uid})`} />
      <UterusBody uid={uid} />
      {spots.map(([x, y, r], i) => (
        <g key={i} className="an-spot" style={{ animationDelay: `${i * 0.35}s` }}>
          <circle cx={x} cy={y} r={r + 7} fill="#C4576B" opacity=".13" />
          <circle cx={x} cy={y} r={r} fill="#B4485C" opacity=".62" />
        </g>
      ))}
    </>
  );
}

/* ── Fibroids: the three positions that matter ───────────────────────────── */
function FibroidArt({ uid }: { uid: string }) {
  return (
    <>
      <circle cx="150" cy="175" r="130" fill={`url(#halo${uid})`} />
      <UterusBody uid={uid} showCavity />

      {/* Numbered markers only. The words used to sit on leader lines out at
          x=272 and x=30 — well outside the 300-unit box — so on a phone
          "Submucosal — heaviest bleeding" was sliced by the right screen edge
          and "Intramural" lost its capital I off the left. The labels now live
          in an HTML legend under the figure, where they can wrap. */}
      <circle cx="150" cy="150" r="17" fill={`url(#gold${uid})`} className="an-nodule" />
      <text x="150" y="155" textAnchor="middle" className="an-pin">1</text>
      <circle cx="106" cy="196" r="21" fill={`url(#gold${uid})`} className="an-nodule" style={{ animationDelay: ".6s" }} />
      <text x="106" y="202" textAnchor="middle" className="an-pin">2</text>
      <circle cx="212" cy="176" r="24" fill={`url(#gold${uid})`} className="an-nodule" style={{ animationDelay: "1.2s" }} />
      <text x="212" y="182" textAnchor="middle" className="an-pin">3</text>
    </>
  );
}

/* ── Cycle: regular rhythm versus irregular ──────────────────────────────── */
function CycleArt({ uid }: { uid: string }) {
  const R = 84;
  const ticks = Array.from({ length: 28 }, (_, i) => i);
  return (
    <>
      <circle cx="150" cy="150" r="120" fill={`url(#halo${uid})`} />
      <circle cx="150" cy="150" r={R} fill="none" stroke="#E9CFC9" strokeWidth="14" />
      {/* fertile window */}
      <path
        d={`M150 150 m0 -${R} a${R} ${R} 0 0 1 ${R * 0.7} ${R * 0.72}`}
        fill="none" stroke="#C9A87C" strokeWidth="14" strokeLinecap="round" opacity=".85"
        transform="rotate(66 150 150)"
      />
      {ticks.map((i) => {
        const a = (i / 28) * Math.PI * 2 - Math.PI / 2;
        return <circle key={i} cx={150 + Math.cos(a) * R} cy={150 + Math.sin(a) * R} r="2.2" fill="#B98D86" opacity=".55" />;
      })}
      {/* travelling marker */}
      <g className="an-orbit" style={{ transformOrigin: "150px 150px" }}>
        <circle cx="150" cy={150 - R} r="11" fill={`url(#glow${uid})`} />
        <circle cx="150" cy={150 - R} r="5" fill="#fff" opacity=".9" />
      </g>
      <text x="150" y="144" textAnchor="middle" className="an-big">21–35</text>
      <text x="150" y="168" textAnchor="middle" className="an-sub">days is a typical cycle</text>
    </>
  );
}

/* ── Fertility: the path an egg has to complete ──────────────────────────── */
function FertilityArt({ uid }: { uid: string }) {
  const stops = [
    { x: 262, y: 112, label: "1 · Ovary releases an egg" },
    { x: 190, y: 104, label: "2 · Travels down the tube" },
    { x: 150, y: 160, label: "3 · Meets sperm, implants" },
  ];
  return (
    <>
      <circle cx="150" cy="170" r="130" fill={`url(#halo${uid})`} />
      <UterusBody uid={uid} showCavity />
      {/* the journey */}
      <path id={`path${uid}`} d="M262 112C224 106 198 100 178 118c-18 16-26 30-28 44"
        fill="none" stroke="#C9A87C" strokeWidth="2.5" strokeDasharray="6 7" opacity=".85" />
      <circle r="9" fill={`url(#glow${uid})`} className="an-travel">
        <animateMotion dur="7s" repeatCount="indefinite" path="M262 112C224 106 198 100 178 118c-18 16-26 30-28 44" />
      </circle>
      {stops.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r="4.5" fill="#C9A87C" />
      ))}
    </>
  );
}

/* ── Recurrent loss: deliberately gentle, non-clinical ───────────────────── */
function ShieldArt({ uid }: { uid: string }) {
  return (
    <>
      <circle cx="150" cy="175" r="132" fill={`url(#halo${uid})`} />
      <circle cx="150" cy="172" r="108" fill="none" stroke="#DCC0A0" strokeWidth="1.4" strokeDasharray="3 9" className="an-slow-spin" style={{ transformOrigin: "150px 172px" }} />
      <circle cx="150" cy="172" r="88" fill="none" stroke="#E9CFC9" strokeWidth="1.2" />
      <UterusBody uid={uid} />
      <circle cx="150" cy="168" r="34" fill={`url(#glow${uid})`} filter={`url(#soft${uid})`} className="an-heartbeat" />
    </>
  );
}

const ART: Record<Condition["art"], (p: { uid: string }) => React.JSX.Element> = {
  ovary: OvaryArt,
  endometriosis: EndoArt,
  fibroids: FibroidArt,
  cycle: CycleArt,
  fertility: FertilityArt,
  shield: ShieldArt,
};

/**
 * The sentence under each illustration.
 *
 * These used to be `<text>` nodes at the bottom of the SVG. Inside a scaled
 * viewBox text cannot wrap, so on a phone the longer ones ran off both edges —
 * "Any step can be the one that needs help…" started 51px left of the drawing
 * and ended 80px past its right side. In HTML they wrap like any other prose.
 */
const CAPTION: Record<Condition["art"], string> = {
  ovary: "One ovary matures a single follicle each month. In PCOS many start and none takes the lead.",
  endometriosis: "Deposits grow outside the uterus and bleed with each cycle, with nowhere for the blood to go.",
  fibroids: "Position matters far more than size.",
  cycle: "The gold band is roughly when ovulation happens.",
  fertility: "Any step can be the one that needs help — which is why both partners are tested.",
  shield: "Most couples who investigate go on to have a baby.",
};

/** Numbered key for the fibroid positions, replacing the old leader-line labels. */
const FIBROID_KEY = [
  { n: 1, label: "Submucosal", note: "inside the cavity — the heaviest bleeding" },
  { n: 2, label: "Intramural", note: "within the muscle wall" },
  { n: 3, label: "Subserosal", note: "on the outer surface — pressure rather than bleeding" },
];

export function Anatomy({ kind, uid = kind }: { kind: Condition["art"]; uid?: string }) {
  const Art = ART[kind];
  // The bottom captions used to live at y≈330 inside the box; with them gone
  // the drawing itself ends around y=300, so the viewBox no longer reserves
  // empty space that pushed the artwork small on a phone.
  const box = kind === "ovary" || kind === "cycle" ? "0 0 300 250" : "0 0 300 300";
  return (
    <div className="anatomy">
      <svg viewBox={box} role="img" aria-label={`Illustration: ${kind}`}>
        <Defs uid={uid} />
        <Art uid={uid} />
      </svg>
      {kind === "fibroids" && (
        <ol className="an-key">
          {FIBROID_KEY.map((k) => (
            <li key={k.n}>
              <span className="an-key-n">{k.n}</span>
              <span><b>{k.label}</b> — {k.note}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="an-cap">{CAPTION[kind]}</p>
    </div>
  );
}
