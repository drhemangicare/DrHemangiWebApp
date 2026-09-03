/**
 * The measurement model behind the week-by-week illustration.
 *
 * The old drawing was one cartoon silhouette scaled up and down, with a head
 * ratio nudged by hand until it "looked about right". This replaces that with
 * the actual numbers, so what changes between week 12 and week 32 is what
 * really changes in a pregnancy rather than what looked good in the editor.
 *
 * SOURCES AND STATUS — read before trusting a number here.
 * These are the standard obstetric reference values taught and charted
 * everywhere (Hadlock/Robinson-style CRL charts, and the classic embryology
 * texts for the developmental milestones). They are population medians, they
 * vary by several days either way between healthy babies, and they are here to
 * drive a *drawing*, not to date a pregnancy or size a baby. Every surface that
 * renders them carries an "information only" note saying exactly that.
 *
 * Dr Hemangi should still read this file before launch. It is the one place in
 * the codebase where a wrong number turns into a picture a patient will measure
 * herself against.
 */

/** Crown–rump length in mm, by completed week. Population medians. */
const CRL_MM: Record<number, number> = {
  6: 4, 7: 10, 8: 16, 9: 23, 10: 31, 11: 41, 12: 54, 13: 74,
  14: 87, 15: 101, 16: 116, 17: 130, 18: 144, 19: 154, 20: 164,
  21: 178, 22: 193, 23: 201, 24: 210, 25: 220, 26: 230, 27: 240,
  28: 250, 29: 260, 30: 270, 31: 279, 32: 287, 33: 294, 34: 300,
  35: 311, 36: 322, 37: 331, 38: 340, 39: 350, 40: 360,
};

/**
 * Head height as a fraction of crown–rump length.
 *
 * This single ratio is what makes a drawing read as an embryo, a fetus or a
 * newborn, and it is easy to get badly wrong.
 *
 * The familiar figure — "a newborn's head is a quarter of its body" — is head
 * against **crown–heel** length, the whole baby including the legs. Everything
 * here is measured against **crown–rump**, which stops at the bottom and is
 * what an early scan actually reports. At term crown–rump is roughly 70% of
 * crown–heel, so the same baby's head is about a *third* of its crown–rump
 * length, not a quarter.
 *
 * Using the crown–heel numbers against a crown–rump drawing (the first version
 * of this file did) gives a term baby a small head on a long body — precisely
 * backwards, and the single most visible way to make a fetal illustration look
 * wrong. Values below are head height ÷ CRL: from a little over half at 8
 * weeks, when the brain is the biggest thing under construction, to a third at
 * term. An adult is nearer an eighth.
 */
const HEAD_RATIO: Record<number, number> = {
  8: 0.56, 10: 0.54, 12: 0.50, 14: 0.48, 16: 0.46, 18: 0.44,
  20: 0.42, 24: 0.39, 28: 0.37, 32: 0.35, 36: 0.34, 40: 0.33,
};

/** Linear interpolation across a sparse table of week → value. */
function lerpTable(table: Record<number, number>, week: number) {
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (week <= keys[0]) return table[keys[0]];
  if (week >= keys[keys.length - 1]) return table[keys[keys.length - 1]];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (week >= a && week <= b) {
      const t = (week - a) / (b - a);
      return table[a] + (table[b] - table[a]) * t;
    }
  }
  return table[keys[keys.length - 1]];
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** 0 before `from`, 1 after `to`, smoothly eased between. */
export function ramp(week: number, from: number, to: number) {
  const t = clamp01((week - from) / (to - from));
  return t * t * (3 - 2 * t);
}

export const crlMm = (week: number) => lerpTable(CRL_MM, week);
export const headRatio = (week: number) => lerpTable(HEAD_RATIO, week);

export type FetalForm = {
  week: number;
  /** head height ÷ crown–rump length */
  head: number;
  /** 0 → tightly C-curved embryo, 1 → the compact flexed fetal position */
  flex: number;
  /** 0 → no limbs, 1 → fully formed and proportionate */
  limb: number;
  /** 0 → webbed paddle, 1 → separate fingers and toes */
  digits: number;
  /** 0 → translucent and lean, 1 → the fat-padded roundness of a term baby */
  fat: number;
  /** 0 → no neck, head sits straight on the trunk, 1 → a distinct neck */
  neck: number;
  /** face detail: brow, nose, lips, ear */
  face: number;
  /** 1 once the baby has usually turned head-down */
  cephalic: number;
};

/**
 * Everything the drawing needs, derived from the week.
 *
 * The ramps encode real developmental timing rather than an even fade from
 * "small" to "big":
 *   · limb buds appear ~wk 5 and are recognisable arms and legs by ~wk 12
 *   · the hand is a webbed paddle until ~wk 10, separate fingers by ~wk 12
 *   · a neck only becomes visible around wk 11–14; before that the head sits
 *     straight onto the shoulders, which is a large part of why early embryos
 *     look the way they do
 *   · subcutaneous fat is laid down from ~wk 28, and it is *only* that which
 *     turns a long thin fetus into a rounded newborn
 *   · most babies are head-down by ~wk 32–36
 */
export function fetalForm(week: number): FetalForm {
  return {
    week,
    head: headRatio(week),
    flex: ramp(week, 8, 16),
    limb: ramp(week, 5, 13),
    digits: ramp(week, 9, 12.5),
    fat: ramp(week, 27, 39),
    neck: ramp(week, 11, 15),
    face: ramp(week, 9, 15),
    cephalic: ramp(week, 31, 36),
  };
}

/**
 * A plain-language note on what is visible on a scan at this week.
 *
 * Deliberately about what a patient would actually be shown, because that is
 * the thing she can check against her own memory of the appointment.
 */
export function scanNote(week: number): string {
  if (week < 6) return "Too early to see on a scan";
  if (week < 8) return "A tiny flicker — the heartbeat";
  if (week < 11) return "Head, body and limb buds are visible";
  if (week < 14) return "The dating scan — head, spine and limbs are clear";
  if (week < 19) return "Fingers, toes and the four chambers of the heart";
  if (week < 23) return "The anomaly scan — every organ is checked";
  if (week < 28) return "A clear profile: nose, lips and chin";
  if (week < 34) return "Too big for one image — scans measure parts now";
  return "Head-down and low, ready for birth";
}
