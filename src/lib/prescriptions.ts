import "server-only";

/**
 * The shape of a prescription, and the validation both the API and the email
 * template rely on.
 *
 * This is clinical text written by the doctor and sent under her name and
 * registration number. The rules here are therefore about *integrity* — that
 * what she typed is what the patient receives, and that nothing incomplete can
 * be sent by accident — not about second-guessing her clinical judgement.
 */

export type Medicine = {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  notes: string;
};

export type PrescriptionInput = {
  diagnosis: string;
  medicines: Medicine[];
  advice: string;
  follow_up_date: string | null;
};

export const EMPTY_MEDICINE: Medicine = { name: "", dose: "", frequency: "", duration: "", notes: "" };

/* Generous but finite. Long enough for real instructions, short enough that a
   runaway paste cannot blow up the email or the row. */
const LIMITS = { name: 160, dose: 80, frequency: 120, duration: 80, notes: 400, diagnosis: 2000, advice: 4000 };
const MAX_MEDICINES = 30;

/* Strip control characters, but KEEP newline and tab: advice is multi-line
   and the email renders it with `white-space:pre-wrap`, so the doctor's
   paragraph breaks have to survive.

   Written with explicit unicode escapes rather than literal control
   characters. The first version embedded the literals directly in the regex
   and they did not survive being written to the file — the expression
   silently became a no-op that matched nothing. A test caught it; reading the
   code would not have, because the characters are invisible on screen. */
const CONTROL_CHARS = new RegExp(
  "[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]",
  "g",
);

function clean(v: unknown, max: number): string {
  return String(v ?? "")
    .replace(CONTROL_CHARS, "")
    .trim()
    .slice(0, max);
}

/** True when a medicine row has nothing in it — used to drop blank rows. */
export function isBlankMedicine(m: Medicine): boolean {
  return !m.name.trim() && !m.dose.trim() && !m.frequency.trim() && !m.duration.trim() && !m.notes.trim();
}

export function normalisePrescription(body: unknown): { value: PrescriptionInput } | { error: string } {
  const b = (body ?? {}) as Record<string, unknown>;

  const rawMeds = Array.isArray(b.medicines) ? b.medicines : [];
  if (rawMeds.length > MAX_MEDICINES) {
    return { error: `A prescription can hold at most ${MAX_MEDICINES} medicines.` };
  }

  const medicines: Medicine[] = rawMeds
    .map((m) => {
      const r = (m ?? {}) as Record<string, unknown>;
      return {
        name: clean(r.name, LIMITS.name),
        dose: clean(r.dose, LIMITS.dose),
        frequency: clean(r.frequency, LIMITS.frequency),
        duration: clean(r.duration, LIMITS.duration),
        notes: clean(r.notes, LIMITS.notes),
      };
    })
    .filter((m) => !isBlankMedicine(m));

  /* A medicine with a dose but no name is almost certainly a half-filled row,
     and sending it would put an unnamed drug in a patient's hands. Reject it
     rather than silently dropping it — the doctor needs to know it went. */
  const nameless = medicines.find((m) => !m.name);
  if (nameless) {
    return { error: "Every medicine needs a name. Fill in the name, or clear that row." };
  }

  const followRaw = clean(b.follow_up_date, 10);
  if (followRaw && !/^\d{4}-\d{2}-\d{2}$/.test(followRaw)) {
    return { error: "The follow-up date is not a valid date." };
  }

  return {
    value: {
      diagnosis: clean(b.diagnosis, LIMITS.diagnosis),
      medicines,
      advice: clean(b.advice, LIMITS.advice),
      follow_up_date: followRaw || null,
    },
  };
}

/**
 * A prescription with nothing in it must never be sent — an empty document
 * under a doctor's registration number is worse than no document.
 */
export function isSendable(p: PrescriptionInput): boolean {
  return p.medicines.length > 0 || p.advice.trim().length > 0 || p.diagnosis.trim().length > 0;
}
