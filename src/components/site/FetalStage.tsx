"use client";
import { stageForWeek, type FetalStage as Stage } from "@/lib/site/pregnancy";
import { fetalForm, type FetalForm } from "@/lib/site/fetalAnatomy";
import { useScanView } from "./ScanView";
import { scanFor } from "@/lib/site/scans";
import { T } from "./Lang";

/**
 * The week-by-week illustration, in two views.
 *
 * The previous version was one cartoon silhouette scaled up and down. This is
 * built from the measurement model in lib/site/fetalAnatomy.ts, so the shape
 * genuinely changes with the week: the head is half the body at 8 weeks and a
 * quarter at term, limbs arrive as buds and become proportionate, a neck
 * appears around week 12, fat rounds everything off after week 28, and the
 * baby turns head-down towards the end.
 *
 * Two renderers share one set of geometry:
 *   · ART  — the warm brand illustration.
 *   · SCAN — a greyscale sonogram. This is the view patients actually
 *            recognise, because it is what they are shown at their own
 *            appointments: black fluid, grainy grey tissue, a burning-white
 *            skull and spine, and the wedge shape the probe fans out.
 *
 * Because both draw the *same* paths, the two views can never drift apart —
 * which is the failure mode of keeping two separate drawings in sync by hand.
 */

const f2 = (n: number) => n.toFixed(2);

/**
 * A limb as one continuous tapered form, ending in its own hand or foot.
 *
 * THE JOINT-DISC TRAP — do not reintroduce it.
 * The previous version offset the raw joint chain and then stamped a filled
 * disc over every joint to hide the seam where a bent outline crosses itself.
 * Those discs are perfectly circular and land exactly on the knee and elbow, so
 * the leg read as a wooden artist's mannequin bolted together at the joints —
 * reported from the live site as "looks like screw in knee". Patching the
 * symptom was the mistake: the seam only appears because you cannot offset a
 * hard corner, and a real limb has no hard corner. It bends around a joint in
 * an arc.
 *
 * So the centreline is *smoothed first* (Chaikin, three passes, widths carried
 * along with the points). The result has no corner sharp enough to fold its own
 * outline, the offsets stay clean, and no patching is needed anywhere.
 *
 * The chain runs all the way to the fingertips or toes and the width profile
 * carries the anatomy: thick at shoulder or hip, narrow at wrist or ankle, a
 * small bulge for the hand or foot pad. Drawing the hand as a separate circle
 * stuck on the end — which is what it used to be — is the other half of what
 * made this look assembled rather than grown.
 */
function limbPath(pts: [number, number][], widths: number[]) {
  // 1. Smooth the centreline. Chaikin corner-cutting keeps the chain inside its
  //    own hull, so a tightly folded knee stays where it was placed.
  let P = pts.map((p) => [p[0], p[1]] as [number, number]);
  let W = widths.slice();
  for (let pass = 0; pass < 5; pass++) {
    const np: [number, number][] = [P[0]], nw: number[] = [W[0]];
    for (let i = 0; i < P.length - 1; i++) {
      np.push([P[i][0] * 0.75 + P[i + 1][0] * 0.25, P[i][1] * 0.75 + P[i + 1][1] * 0.25]);
      nw.push(W[i] * 0.75 + W[i + 1] * 0.25);
      np.push([P[i][0] * 0.25 + P[i + 1][0] * 0.75, P[i][1] * 0.25 + P[i + 1][1] * 0.75]);
      nw.push(W[i] * 0.25 + W[i + 1] * 0.75);
    }
    np.push(P[P.length - 1]); nw.push(W[W.length - 1]);
    P = np; W = nw;
  }

  // 2. Offset both sides along averaged normals.
  const left: [number, number][] = [], right: [number, number][] = [];
  for (let i = 0; i < P.length; i++) {
    let dx = 0, dy = 0;
    if (i > 0) { dx += P[i][0] - P[i - 1][0]; dy += P[i][1] - P[i - 1][1]; }
    if (i < P.length - 1) { dx += P[i + 1][0] - P[i][0]; dy += P[i + 1][1] - P[i][1]; }
    let len = Math.hypot(dx, dy);
    if (len < 1e-6) { dx = 1; dy = 0; len = 1; }
    dx /= len; dy /= len;
    const w = W[i] / 2;
    left.push([P[i][0] - dy * w, P[i][1] + dx * w]);
    right.push([P[i][0] + dy * w, P[i][1] - dx * w]);
  }

  // 3. One closed outline: down one side, round the tip, back up the other,
  //    round the root. Quadratic midpoint smoothing over dense samples.
  const seg = (a: [number, number][]) => {
    let d = "";
    for (let i = 1; i < a.length; i++) {
      const mx = (a[i - 1][0] + a[i][0]) / 2, my = (a[i - 1][1] + a[i][1]) / 2;
      d += `Q${f2(a[i - 1][0])} ${f2(a[i - 1][1])} ${f2(mx)} ${f2(my)}`;
    }
    const e = a[a.length - 1];
    return d + `L${f2(e[0])} ${f2(e[1])}`;
  };
  const rev = right.slice().reverse();
  const tipR = W[W.length - 1] / 2, rootR = W[0] / 2;
  return (
    `M${f2(left[0][0])} ${f2(left[0][1])}` +
    seg(left) +
    `A${f2(tipR)} ${f2(tipR)} 0 0 1 ${f2(rev[0][0])} ${f2(rev[0][1])}` +
    seg(rev) +
    `A${f2(rootR)} ${f2(rootR)} 0 0 1 ${f2(left[0][0])} ${f2(left[0][1])}Z`
  );
}

type Geo = {
  headPath: string; hx: number; hy: number; hr: number; tilt: number;
  trunkPath: string; spine: [number, number][]; ribs: string[];
  footPath: string; handPath: string;
  armNear: string; armFar: string; legNear: string; legFar: string;
  armBone: [number, number][]; legBone: [number, number][];
  hand: [number, number]; foot: [number, number]; handR: number; footR: number;
  elbowAt: [number, number]; kneeAt: [number, number];
  chest: [number, number]; navel: [number, number]; cordFrom: [number, number];
  box: { x0: number; y0: number; x1: number; y1: number };
  form: FetalForm;
};

/**
 * Turn the measurement model into drawable geometry.
 *
 * Everything is expressed against the crown–rump span so the proportions stay
 * honest at every week; the caller normalises the result into a fixed frame.
 */
function buildGeo(form: FetalForm): Geo {
  const H = 62;                                  // crown–rump span, local units
  const headH = H * form.head;
  const hr = headH / 2;
  const TL = H - headH;                          // trunk length
  const hx = 43, hy = 27 + hr * 0.05;

  /* THE POSE.
     The first attempt drew an upright figure with the limbs hanging down, and
     it read as a peanut with a head — the limbs disappeared inside the trunk
     silhouette and nothing said "baby". A curled fetus is recognisable because
     of a specific set of landmarks, and all of them have to be *outside* the
     body outline to register:
       · the spine curved into a C, back outermost
       · one knee drawn up past the belly
       · one elbow out, with the hand tucked back up near the face
       · a foot showing at the bottom of the curl
     So the joints below are placed to protrude deliberately, and `flex` tightens
     the whole curl as the weeks go on — an early fetus is a loose C, a term baby
     is folded into the smallest space it can occupy. */
  const F = form.flex;
  const neck: [number, number] = [hx + hr * 0.38, hy + hr * 0.72];  // overlaps the skull, never floats below it
  const rump: [number, number] = [hx - hr * 0.05 - TL * 0.04, neck[1] + TL * 0.86];
  const tw = TL * (0.44 + form.fat * 0.10);      // trunk width

  // belly bulges right, back curves left — the fetal liver makes the abdomen
  // the widest part of the body at every week before term
  const bellyX = hx + tw * (0.52 + form.fat * 0.06);
  const backX = hx - tw * (0.44 + form.fat * 0.02);

  const trunkPath =
    `M${f2(neck[0] - tw * 0.30)} ${f2(neck[1] - tw * 0.10)}` +
    `C${f2(backX)} ${f2(neck[1] + TL * 0.22)} ${f2(backX - tw * 0.06)} ${f2(neck[1] + TL * 0.58)} ${f2(rump[0])} ${f2(rump[1])}` +
    `C${f2(rump[0] + tw * 0.55)} ${f2(rump[1] + tw * 0.20)} ${f2(bellyX + tw * 0.04)} ${f2(neck[1] + TL * 0.66)} ${f2(bellyX)} ${f2(neck[1] + TL * 0.40)}` +
    `C${f2(bellyX - tw * 0.05)} ${f2(neck[1] + TL * 0.16)} ${f2(neck[0] + tw * 0.42)} ${f2(neck[1] - tw * 0.06)} ${f2(neck[0] + tw * 0.16)} ${f2(neck[1] - tw * 0.12)}Z`;

  const spine: [number, number][] = [
    [neck[0] - tw * 0.22, neck[1]],
    [backX + tw * 0.16, neck[1] + TL * 0.28],
    [backX + tw * 0.12, neck[1] + TL * 0.60],
    [rump[0] + tw * 0.12, rump[1] - TL * 0.04],
  ];

  const ribs: string[] = [];
  for (let i = 0; i < 4; i++) {
    const y = neck[1] + TL * (0.14 + i * 0.11);
    ribs.push(`M${f2(backX + tw * 0.24)} ${f2(y)}Q${f2(hx + tw * 0.1)} ${f2(y + tw * 0.14)} ${f2(bellyX - tw * 0.16)} ${f2(y + tw * 0.04)}`);
  }

  /* Limbs. Upper arm ≈ forearm; thigh a little longer than calf. Both chains
     are scaled by `limb`, which ramps from the buds of week 5 to proportionate
     arms and legs by week 13. */
  const L = form.limb;
  const lw = tw * (0.25 - form.fat * 0.03);   // limbs slim relative to a fattening trunk

  /* Each chain runs to the fingertips or the toes, so the hand and the foot are
     the end of one continuous form. They used to be a separate circle and
     ellipse laid over the stump of a tube, which is a large part of why the
     figure read as assembled from parts. */

  // shoulder → elbow (out past the belly) → wrist (tucked back up) → hand
  const shoulder: [number, number] = [neck[0] + tw * 0.10, neck[1] + TL * 0.10];
  const elbow: [number, number] = [
    shoulder[0] + TL * (0.26 + 0.05 * (1 - F)) * L,
    shoulder[1] + TL * 0.21 * L,
  ];
  const wrist: [number, number] = [
    elbow[0] - TL * 0.20 * L * F - TL * 0.02 * L,
    elbow[1] - TL * (0.10 + 0.08 * F) * L,
  ];
  // the hand carries on up toward the cheek — that curled hand near the face is
  // one of the few landmarks that makes a curled fetus instantly readable
  const hand: [number, number] = [
    wrist[0] - TL * 0.05 * L,
    wrist[1] - TL * (0.07 + 0.03 * F) * L,
  ];

  // hip → knee (drawn up past the belly) → ankle → toes
  const hip: [number, number] = [rump[0] + tw * 0.34, rump[1] - TL * 0.10];
  const knee: [number, number] = [
    hip[0] + TL * (0.32 + 0.07 * (1 - F)) * L,
    hip[1] - TL * (0.22 * F - 0.03) * L,
  ];
  const ankle: [number, number] = [
    knee[0] - TL * (0.15 + 0.09 * F) * L,
    knee[1] + TL * 0.30 * L,
  ];
  // the foot points forward and slightly down from the ankle, and is longer
  // than it is thick — a round cap on the ankle reads as a peg leg
  const toe: [number, number] = [
    ankle[0] + TL * (0.13 + 0.03 * L) * L,
    ankle[1] + TL * 0.05 * L,
  ];

  /* Width profiles are NOT a straight taper, and that matters more than any
     other number here. A limb that thins evenly from root to tip reads as a
     cone — which is what made the first fix look like a bird's leg ending in a
     claw. A real limb swells again below the joint: the calf below the knee,
     the forearm below the elbow. The samples below are hip, mid-thigh, knee,
     mid-calf, ankle (and the arm equivalent), so the bulge can exist at all. */
  const armW = [lw * 1.02, lw * 0.86, lw * 0.68, lw * 0.74, lw * 0.44];
  const legW = [lw * 1.44, lw * 1.20, lw * 0.86, lw * 0.96, lw * 0.48];

  const mid = (a: [number, number], b: [number, number], t = 0.5): [number, number] =>
    [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  const armChain: [number, number][] = [shoulder, mid(shoulder, elbow), elbow, mid(elbow, wrist), wrist];
  const legChain: [number, number][] = [hip, mid(hip, knee), knee, mid(knee, ankle), ankle];

  /* The hand and the foot are their own small tapered wedges rather than the
     pointed end of the limb. A foot in profile is a wedge — heel at the back,
     sole along the bottom, toes forward — and a hand is a rounded mitten. Both
     were previously a plain circle stuck on a stump, and then a point. */
  const footPath = limbPath(
    [[ankle[0] - lw * 0.34, ankle[1] + lw * 0.18], mid(ankle, toe, 0.55), toe],
    [lw * 0.78, lw * 0.62, lw * 0.30]);
  const handPath = limbPath(
    [wrist, mid(wrist, hand, 0.55), hand],
    [lw * 0.46, lw * 0.56, lw * 0.34]);

  const armNear = limbPath(armChain, armW);
  const legNear = limbPath(legChain, legW);
  const off = (p: [number, number], dx: number, dy: number): [number, number] => [p[0] + dx, p[1] + dy];
  const shift = (c: [number, number][], dx: number, dy: number) => c.map((p) => off(p, dx, dy));
  const armFar = limbPath(shift(armChain, -lw * 1.05, lw * 0.38), armW.map((w) => w * 0.88));
  const legFar = limbPath(shift(legChain, -lw * 1.15, lw * 0.36), legW.map((w) => w * 0.90));

  /* The head, as a facing-right profile.
     The outline itself carries the face — forehead, brow notch, nose, lip,
     chin. That silhouette is what makes it read as a baby; details painted onto
     a plain oval never do. The forehead is deliberately huge early on, because
     it is: the brain is the largest thing under construction. */
  const brow = 0.55 + form.face * 0.35;
  const nose = hr * 0.11 * form.face;
  const chin = hr * 0.15 * (0.35 + form.face * 0.65);
  const headPath =
    `M${f2(hx - hr * 0.12)} ${f2(hy - hr)}` +
    `C${f2(hx + hr * (0.62 + 0.16 * (1 - form.face)))} ${f2(hy - hr * 0.98)} ${f2(hx + hr * 0.94)} ${f2(hy - hr * 0.46)} ${f2(hx + hr * 0.86)} ${f2(hy - hr * 0.06)}` +
    `L${f2(hx + hr * (0.80 * brow + 0.04))} ${f2(hy + hr * 0.10)}` +
    `l${f2(nose * 1.5)} ${f2(nose * 0.7)}l${f2(-nose * 1.2)} ${f2(nose * 0.7)}` +
    `C${f2(hx + hr * 0.78)} ${f2(hy + hr * 0.40)} ${f2(hx + hr * 0.66 + chin)} ${f2(hy + hr * 0.54)} ${f2(hx + hr * 0.52)} ${f2(hy + hr * 0.72)}` +
    `C${f2(hx + hr * 0.30)} ${f2(hy + hr * 0.96)} ${f2(hx - hr * 0.20)} ${f2(hy + hr * 1.02)} ${f2(hx - hr * 0.48)} ${f2(hy + hr * 0.84)}` +
    `C${f2(hx - hr * 0.94)} ${f2(hy + hr * 0.56)} ${f2(hx - hr * 1.02)} ${f2(hy - hr * 0.30)} ${f2(hx - hr * 0.72)} ${f2(hy - hr * 0.72)}` +
    `C${f2(hx - hr * 0.52)} ${f2(hy - hr * 0.96)} ${f2(hx - hr * 0.30)} ${f2(hy - hr)} ${f2(hx - hr * 0.12)} ${f2(hy - hr)}Z`;

  const pad = lw * 0.9;
  const xs = [backX, hx - hr, bellyX, elbow[0], knee[0], hand[0], ankle[0], toe[0]];
  const ys = [hy - hr, rump[1], knee[1], ankle[1], hand[1], toe[1]];
  return {
    headPath, hx, hy, hr,
    tilt: 6 + form.flex * 5,
    trunkPath, spine, ribs, armNear, armFar, legNear, legFar, footPath, handPath,
    armBone: [shoulder, elbow, wrist], legBone: [hip, knee, ankle],
    hand, foot: toe, elbowAt: elbow, kneeAt: knee, handR: lw * 0.30, footR: lw * 0.28,
    chest: [hx + tw * 0.14, neck[1] + TL * 0.18],
    navel: [bellyX - tw * 0.22, neck[1] + TL * 0.50],
    cordFrom: [bellyX - tw * 0.10, neck[1] + TL * 0.50],
    box: {
      x0: Math.min(...xs) - pad, x1: Math.max(...xs) + pad,
      y0: Math.min(...ys) - pad * 0.5, y1: Math.max(...ys) + pad,
    },
    form,
  };
}


/* ── the warm illustration ───────────────────────────────────────────────── */
function ArtFetus({ geo, uid }: { geo: Geo; uid: string }) {
  const skin = `url(#skin${uid})`;
  const { hx, hy, hr, form } = geo;
  const line = "#C58C82";
  return (
    <>
      <g opacity=".38">
        <path d={geo.legFar} fill={skin} />
        <path d={geo.armFar} fill={skin} />
      </g>

      <path d={geo.trunkPath} fill={skin} stroke={line} strokeWidth=".7" strokeOpacity=".45" />
      {/* form shading — flat fill is what made older versions read as a decal */}
      <path d={geo.trunkPath} fill="#B87E76" opacity=".13"
        transform={`translate(${f2(-hr * 0.16)} 0)`} clipPath={`url(#tc${uid})`} />
      <clipPath id={`tc${uid}`}><path d={geo.trunkPath} /></clipPath>

      <circle cx={geo.chest[0]} cy={geo.chest[1]} r={hr * 0.42}
        fill={`url(#heart${uid})`} className="an-heartbeat" />

      {/* Limbs are one continuous form each, hand and foot included, and are
          NEVER stroked.

          A stroke here is what put the "screw" back in the knee after the joint
          discs were removed. Offsetting a tightly folded centreline makes the
          inner edge loop back through itself at the fold; filled, that loop
          simply merges into the limb and is invisible, but stroked it is drawn
          as a hard ring sitting exactly on the knee and the elbow. Separation
          from the trunk comes from the limb being a shade deeper instead. */}
      <path d={geo.legNear} fill={skin} />
      <path d={geo.legNear} fill="#B87E76" opacity=".10" />
      <path d={geo.footPath} fill={skin} />
      <path d={geo.footPath} fill="#B87E76" opacity=".13" />
      <path d={geo.armNear} fill={skin} />
      <path d={geo.armNear} fill="#B87E76" opacity=".07" />
      <path d={geo.handPath} fill={skin} />
      <path d={geo.handPath} fill="#B87E76" opacity=".09" />
      {form.digits > 0.4 && (
        <path
          d={[0, 1, 2].map((i) =>
            `M${f2(geo.hand[0] - geo.handR * 0.5 + i * geo.handR * 0.5)} ${f2(geo.hand[1] - geo.handR * 0.2)}` +
            `v${f2(geo.handR * 0.7)}`).join("")}
          stroke={line} strokeWidth=".35" strokeOpacity={0.38 * form.digits} strokeLinecap="round" fill="none" />
      )}
      <circle cx={geo.navel[0]} cy={geo.navel[1]} r=".9" fill={line} opacity=".45" />

      <path d={geo.headPath} fill={skin} stroke={line} strokeWidth=".7" strokeOpacity=".45" />
      <ellipse cx={hx - hr * 0.24} cy={hy - hr * 0.44} rx={hr * 0.34} ry={hr * 0.24}
        fill="#fff" opacity=".38" transform={`rotate(-18 ${f2(hx - hr * 0.24)} ${f2(hy - hr * 0.44)})`} />
      {form.face > 0.25 && (
        <g opacity={form.face}>
          {/* the eye stays closed: eyelids are fused until about week 26 */}
          <path d={`M${f2(hx + hr * 0.30)} ${f2(hy - hr * 0.06)}q${f2(hr * 0.20)} ${f2(hr * 0.14)} ${f2(hr * 0.40)} 0`}
            stroke="#8C4F58" strokeWidth=".7" fill="none" strokeLinecap="round" opacity=".65" />
          <path d={`M${f2(hx + hr * 0.44)} ${f2(hy + hr * 0.42)}q${f2(hr * 0.10)} ${f2(hr * 0.08)} ${f2(hr * 0.20)} 0`}
            stroke="#B4666B" strokeWidth=".6" fill="none" strokeLinecap="round" opacity=".55" />
          <ellipse cx={hx + hr * 0.30} cy={hy + hr * 0.24} rx={hr * 0.16} ry={hr * 0.11} fill="#E88F92" opacity=".22" />
          {/* the ear rides low early and climbs to its place by about week 14 */}
          <path d={`M${f2(hx - hr * 0.40)} ${f2(hy + hr * (0.34 - form.face * 0.20))}a${f2(hr * 0.17)} ${f2(hr * 0.22)} 0 1 0 ${f2(hr * 0.05)} ${f2(hr * 0.34)}`}
            fill="none" stroke={line} strokeWidth=".55" strokeOpacity=".5" />
        </g>
      )}
    </>
  );
}

/** What a 5–7 week scan actually shows: a dark sac with a yolk sac ring. */
function EarlySac({ uid, week }: { uid: string; week: number }) {
  const yolk = week >= 5.5;
  const pole = week >= 6;
    return (
    <g>
      <ellipse cx="50" cy="52" rx="30" ry="26" fill="#FFF7F4" stroke="#E0B3AC" strokeWidth="1.4" strokeDasharray="4 6" />
      {yolk && <circle cx="40" cy="46" r="7" fill="none" stroke="#E7BDB6" strokeWidth="2" />}
      {pole && <ellipse cx="56" cy="56" rx="8" ry="5.5" fill={`url(#skin${uid})`} transform="rotate(22 56 56)" />}
      {pole && <circle cx="56" cy="56" r="5" fill={`url(#heart${uid})`} className="an-heartbeat" />}
    </g>
  );
}

/**
 * The embryo, weeks ~7–9.
 *
 * A plain teardrop with two dots on it — the first version of this — is the one
 * stage patients say looks like nothing. The real thing has a very particular
 * shape and it is worth drawing properly, because the 7–8 week scan is often
 * the first picture a woman is given:
 *   · a huge cranium bent forward over a tiny chest, so the whole embryo is a
 *     comma rather than an oval
 *   · a visible neck bend (the cervical flexure) where the head folds down
 *   · a tail, which is real and which regresses over these very weeks
 *   · limb buds: arms lead the legs by a couple of days, both starting as
 *     paddles before any digits exist
 *   · the heart bulging out of the chest wall — proportionally enormous
 */
function Embryo({ uid, week }: { uid: string; week: number }) {
  const m = Math.min(1, Math.max(0, (week - 6) / 3.5));       // 0 at wk 6 → 1 by wk 9.5
  const tail = Math.max(0, 1 - m * 1.35);                     // gone by ~wk 8.5
  const headR = 15 - m * 1.5;
  const hx = 40, hy = 36;

  // comma-shaped body: big head, C-curved back, tapering rump
  const body =
    `M${f2(hx + headR * 0.9)} ${f2(hy + headR * 0.5)}` +
    `C${f2(hx + 19)} ${f2(hy + 22)} ${f2(hx + 17)} ${f2(hy + 34)} ${f2(hx + 8)} ${f2(hy + 40)}` +
    `C${f2(hx + 1)} ${f2(hy + 45)} ${f2(hx - 8)} ${f2(hy + 44)} ${f2(hx - 12)} ${f2(hy + 38)}` +
    `C${f2(hx - 16)} ${f2(hy + 31)} ${f2(hx - 13)} ${f2(hy + 20)} ${f2(hx - 12)} ${f2(hy + 12)}Z`;
  const tailPath =
    `M${f2(hx - 10)} ${f2(hy + 40)}q${f2(-9 * tail)} ${f2(6 * tail)} ${f2(-4 * tail)} ${f2(13 * tail)}`;
  const armB: [number, number] = [hx + 15, hy + 20];
  const legB: [number, number] = [hx + 7, hy + 38];
  const armR = 2.2 + m * 3.6, legR = 1.4 + m * 3.4;

    const skin = `url(#skin${uid})`;
  return (
    <g>
      {tail > 0.05 && (
        <path d={tailPath} fill="none" stroke={skin} strokeWidth={3.4 * tail} strokeLinecap="round" opacity=".9" />
      )}
      <path d={body} fill={skin} stroke="#C58C82" strokeWidth="1" strokeOpacity=".55" />
      <circle cx={armB[0]} cy={armB[1]} r={armR} fill={skin} stroke="#C58C82" strokeWidth=".8" strokeOpacity=".5" />
      <circle cx={legB[0]} cy={legB[1]} r={legR} fill={skin} stroke="#C58C82" strokeWidth=".8" strokeOpacity=".5" />
      {/* the cranium, bent forward over the chest */}
      <circle cx={hx} cy={hy} r={headR} fill={skin} stroke="#C58C82" strokeWidth="1" strokeOpacity=".55" />
      <ellipse cx={hx - headR * 0.3} cy={hy - headR * 0.35} rx={headR * 0.38} ry={headR * 0.26}
        fill="#fff" opacity=".4" transform={`rotate(-20 ${f2(hx - headR * 0.3)} ${f2(hy - headR * 0.35)})`} />
      {/* the optic cup — a dark spot on the side of the head at this stage */}
      <circle cx={hx + headR * 0.45} cy={hy + headR * 0.05} r={1.8 + m * 1.4} fill="#7A4046" opacity=".5" />
      {/* the pharyngeal arches, the little ridges under the ear region */}
      <path d={`M${f2(hx + headR * 0.5)} ${f2(hy + headR * 0.55)}q3 3 1 6`}
        stroke="#C58C82" strokeWidth=".8" strokeOpacity=".45" fill="none" strokeLinecap="round" />
      <circle cx={hx + 11} cy={hy + 16} r="7" fill={`url(#heart${uid})`} className="an-heartbeat" />
    </g>
  );
}

function Defs({ uid }: { uid: string }) {
  return (
    <defs>
      <radialGradient id={`sac${uid}`} cx=".38" cy=".32" r=".72">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity=".95" />
        <stop offset=".45" stopColor="#FBE7E2" stopOpacity=".72" />
        <stop offset=".85" stopColor="#F2C9C4" stopOpacity=".42" />
        <stop offset="1" stopColor="#E3A7A2" stopOpacity=".22" />
      </radialGradient>
      <linearGradient id={`skin${uid}`} x1=".2" y1="0" x2=".85" y2="1">
        <stop offset="0" stopColor="#FFF3EF" />
        <stop offset=".35" stopColor="#F9D8D0" />
        <stop offset=".75" stopColor="#EBAFA6" />
        <stop offset="1" stopColor="#CE8579" />
      </linearGradient>
      <radialGradient id={`heart${uid}`} cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#FF9E96" />
        <stop offset="1" stopColor="#FF9E96" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`rim${uid}`} x1=".15" y1="0" x2=".85" y2="1">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity=".9" />
        <stop offset=".5" stopColor="#FFFFFF" stopOpacity="0" />
        <stop offset="1" stopColor="#C98D86" stopOpacity=".5" />
      </linearGradient>
      <linearGradient id={`plac${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#EFB4AC" />
        <stop offset=".55" stopColor="#E09A92" />
        <stop offset="1" stopColor="#EFB4AC" />
      </linearGradient>
      <filter id={`bl${uid}`} x="-70%" y="-70%" width="240%" height="240%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>
  );
}

const PL = (() => {
  const rad = 112, cx = 150, cy = 150;
  const a1 = Math.PI * 0.82, a2 = Math.PI * 1.18;
  const p = (ang: number) => `${(cx + Math.cos(ang) * rad).toFixed(1)} ${(cy + Math.sin(ang) * rad).toFixed(1)}`;
  const mid = (a1 + a2) / 2;
  return {
    d: `M${p(a1)}A${rad} ${rad} 0 0 1 ${p(a2)}`,
    cx: (cx + Math.cos(mid) * (rad - 9)).toFixed(1),
    cy: (cy + Math.sin(mid) * (rad - 9)).toFixed(1),
  };
})();

function fillFor(week: number) {
  const k = Math.min(1, Math.max(0, (week - 3) / 37));
  return 0.18 + 0.60 * Math.pow(k, 0.6);
}

export function FetalStageArt({
  week, stage, uid = "f", cap = true, note,
}: { week: number; stage?: Stage; uid?: string; cap?: boolean; note?: string }) {
  const { scan } = useScanView();
  const st: Stage = stage ?? stageForWeek(week);
  const fill = fillFor(week);
  const shown = Math.round(week);
  const form = fetalForm(week);

  /* Scan view is a REAL image or it does not exist.
     There is no drawn sonogram fallback here on purpose — see lib/site/scans.ts.
     The toggle that switches this on is itself hidden until the clinic supplies
     an image, so in practice this branch is unreachable while the list is empty;
     the guard is here so that stays true if the toggle is ever placed by hand. */
  const real = scan ? scanFor(week) : null;
  if (scan && real) {
    return (
      <figure className="fetal fetal-real">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={real.src} alt={real.alt} width={real.width} height={real.height} loading="lazy" decoding="async" />
        <figcaption className="fetal-cap">
          {/* The image's OWN week, never the week the reader is browsing — the
              clinic supplies a handful of scans and the nearest one is shown,
              so calling a 20-week image "week 27" would simply be false. */}
          <b><T>Real scan</T> · <T>week</T> {real.week}</b>
          {real.note ? <> — <T>{real.note}</T></> : null}
          <br />
          <T>A real ultrasound from the clinic, shared with the patient&apos;s consent. Every scan looks different — yours will not look the same, and that is normal.</T>
        </figcaption>
      </figure>
    );
  }

  let inner: React.JSX.Element;
  let normalise = "";
  if (st === "preconception" || st === "blastocyst") {
    inner = <EarlySac uid={uid} week={week} />;
  } else if (st === "embryo-early" || st === "embryo-late") {
    inner = <Embryo uid={uid} week={week} />;
  } else {
    const geo = buildGeo(form);
    /* Normalise: the drawn extent changes every week, so measure it and fit a
       fixed box. Without this the later weeks burst out of the sac. The tilt is
       folded into the measurement so the margin holds at every week. */
    const { x0, x1, y0, y1 } = geo.box;
    const rad = (geo.tilt * Math.PI) / 180, co = Math.cos(rad), si = Math.sin(rad);
    const rw = (x1 - x0) * co + (y1 - y0) * si;
    const rh = (x1 - x0) * si + (y1 - y0) * co;
    const k = Math.min(84 / rh, 86 / rw);
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    /* The figure stays upright at every week, and the caption carries the
       head-down fact in words instead.
       Turning it over is the literally accurate thing to do from ~wk 32, and it
       was tried: rigidly rotating the drawing 180° puts the face upside down,
       and because this pose is built to be read the right way up — chin bowed,
       hand tucked by the cheek, knee raised towards the belly — every one of
       those landmarks stops working inverted. Weeks 36 and 40 came out as an
       unreadable blob with limbs apparently floating off it, while the upright
       week 32 beside them read perfectly.
       A drawing a patient cannot parse is not more accurate than one she can,
       so legibility wins and `cephalic` now only drives the caption. */
    normalise =
      `translate(50 52) scale(${k.toFixed(4)}) rotate(${geo.tilt.toFixed(1)}) ` +
      `translate(${(50 - mx).toFixed(2)} ${(52 - my).toFixed(2)}) translate(-50 -52)`;
    inner = <ArtFetus geo={geo} uid={uid} />;
  }

  /* Past this point the view is ALWAYS the illustration.
     `scan` can still be true here for a returning visitor whose stored
     preference dates from when the sonogram was drawn: the toggle is hidden
     with no real images configured, but the remembered value survives. The
     drawn sonogram and its filters are gone, so honouring that flag would
     render a figure against missing gradients. It falls back to the
     illustration instead of a broken frame. */
  const scale = (fill * 252) / 80;
  const rBody = fill * 126;
  const caption = note ?? (week >= 32 ? "Most babies are head-down by now" : undefined);

  return (
    <div className="fetal">
      <svg viewBox="0 0 300 300" role="img" aria-label={`Illustration of development at week ${shown}`}>
        <Defs uid={uid} />

        <circle cx="150" cy="150" r="126" fill={`url(#sac${uid})`} />
        <circle cx="150" cy="150" r="126" fill="none" stroke="#E7BDB6" strokeWidth="1.2" strokeOpacity=".8" />
        <circle cx="150" cy="150" r="126" fill="none" stroke={`url(#rim${uid})`} strokeWidth="5" opacity=".55" />
        <ellipse cx="108" cy="96" rx="44" ry="30" fill="#fff" opacity=".3" filter={`url(#bl${uid})`} />
        <circle cx="150" cy="150" r="112" fill="none" stroke="#F0D3CD" strokeWidth="1" strokeDasharray="2 8"
          className="an-slow-spin" style={{ transformOrigin: "150px 150px" }} />
        {week >= 8 && (
          <>
            <path
              d={`M${(150 - rBody * 0.5).toFixed(1)} ${(150 + rBody * 0.3).toFixed(1)}` +
                 `Q${(100 - week * 0.2).toFixed(1)} ${(190 + week * 0.35).toFixed(1)} ${PL.cx} ${PL.cy}`}
              fill="none" stroke="#E2A79E" strokeWidth={2 + week * 0.05} strokeLinecap="round" opacity=".7"
              className="an-cord" />
            <path d={PL.d} fill="none" stroke={`url(#plac${uid})`} strokeWidth="17" strokeLinecap="round" opacity=".55" />
          </>
        )}
        <ellipse cx="152" cy={150 + rBody * 0.92} rx={rBody * 0.62} ry={rBody * 0.16}
          fill="#B87E76" opacity=".18" filter={`url(#bl${uid})`} />

        {caption && <text x="150" y="288" textAnchor="middle" className="an-sub">{caption}</text>}

        <g className="an-float">
          <g className="fs-scale" transform={`translate(150 150) scale(${scale.toFixed(4)}) translate(-50 -52)`}>
            <g className="fs-body" transform={normalise || undefined}>{inner}</g>
          </g>
        </g>
      </svg>
      {cap && (
        <p className="fetal-cap">
          <T>Illustration is stylised and not to scale between weeks.</T>
        </p>
      )}
    </div>
  );
}
