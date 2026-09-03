import "server-only";
import PDFDocument from "pdfkit";
import type { Medicine } from "@/lib/prescriptions";

/**
 * The printable prescription.
 *
 * ── WHY THERE IS NO EMBEDDED FONT, AND WHY TEXT IS CHECKED FIRST ──────────
 * PDF base fonts (Helvetica here) can only encode WinAnsi/CP1252. Everything
 * outside it fails, and it fails *silently and differently* depending on the
 * font, which is the dangerous part. Measured, by generating PDFs and reading
 * them back with `pdftotext`:
 *
 *   Helvetica   "Fee ₹500 END"      →  "Fee ¹500 END"        ← ₹ became ¹
 *   Helvetica   "AAA आरती END"       →  "AAA •i0’I@ END"      ← mojibake
 *   DejaVu TTF  "AAA आरती BBB"       →  "AAA"                 ← rest of the
 *                                                               line vanished
 *
 * So one font corrupts the text into something that still looks like text, and
 * the other silently deletes everything after the offending character. On a
 * prescription both are unacceptable: a dose or a drug name could disappear or
 * change and nobody would know.
 *
 * The answer is not a bigger font — a 742KB DejaVu still has no Devanagari, so
 * it only moves the boundary. It is to KNOW what cannot be drawn:
 * `toWinAnsi()` maps what has a faithful equivalent (₹ → "Rs."), strips what
 * does not, and REPORTS every substitution. The caller surfaces that to the
 * doctor, and the HTML email — which is full Unicode and always correct —
 * carries the complete text regardless. The PDF is never allowed to be a
 * quietly wrong copy of it.
 */

/** Characters CP1252 can represent beyond ASCII and Latin-1. */
const CP1252_EXTRAS = new Set(
  "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ".split(""),
);

/** Faithful replacements for things a clinic actually types. */
const TRANSLITERATE: Record<string, string> = {
  "₹": "Rs.", // ₹ — Helvetica renders this as "¹", which is simply wrong
  " ": " ", // non-breaking space (arrives via copy-paste constantly)
  "→": "->",
  "×": "x",
  "≤": "<=",
  "≥": ">=",
  "µ": "u", // µg typed as micro sign
};

export type SanitiseReport = { text: string; removed: string[] };

export function toWinAnsi(input: string): SanitiseReport {
  const removed: string[] = [];
  let out = "";
  for (const ch of input) {
    if (TRANSLITERATE[ch] !== undefined) {
      out += TRANSLITERATE[ch];
      continue;
    }
    const code = ch.codePointAt(0)!;
    const ok = (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || CP1252_EXTRAS.has(ch) || ch === "\n";
    if (ok) out += ch;
    else if (!removed.includes(ch)) removed.push(ch);
  }
  return { text: out, removed };
}

export type PrescriptionPdfInput = {
  patientName: string;
  patientAge: number | null;
  referenceCode: string;
  consultDateLabel: string;
  diagnosis: string;
  medicines: Medicine[];
  advice: string;
  followUpLabel: string | null;
  doctorName: string;
  qualifications: string | null;
  registrationNo: string | null;
  clinicAddress: string | null;
  supportEmail: string;
};

const PLUM = "#4A1F35";
const PLUM_DEEP = "#2E1020";
const MUTED = "#6B3450";
const LINE = "#E8D8D3";
const GOLD = "#B8955F";

export async function buildPrescriptionPdf(
  input: PrescriptionPdfInput,
): Promise<{ buffer: Buffer; removed: string[] }> {
  const allRemoved: string[] = [];
  /** Sanitise on the way in, collecting anything that could not be drawn. */
  const S = (v: string | null | undefined): string => {
    const r = toWinAnsi(String(v ?? ""));
    for (const c of r.removed) if (!allRemoved.includes(c)) allRemoved.push(c);
    return r.text;
  };

  const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: `Prescription ${input.referenceCode}` } });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const M = 48; // page margin
  const W = doc.page.width;
  const CONTENT = W - M * 2;

  // ── letterhead ────────────────────────────────────────────────────────
  doc.rect(0, 0, W, 104).fill("#FBF1EE");
  doc.fillColor(PLUM_DEEP).font("Helvetica-Bold").fontSize(19).text(S(input.doctorName), M, 30);
  if (input.qualifications) {
    doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(S(input.qualifications), M, 54, { width: CONTENT * 0.62 });
  }
  doc.font("Helvetica").fontSize(8).fillColor(GOLD)
    .text("GYNAECOLOGY  ·  FERTILITY  ·  SURGERY", M, 76, { characterSpacing: 1.1 });

  if (input.registrationNo) {
    doc.font("Helvetica").fontSize(8.5).fillColor(MUTED)
      .text(`Reg. No. ${S(input.registrationNo)}`, W / 2, 32, { width: CONTENT / 2, align: "right" });
  }
  if (input.clinicAddress) {
    doc.font("Helvetica").fontSize(8).fillColor(MUTED)
      .text(S(input.clinicAddress), W / 2, 48, { width: CONTENT / 2, align: "right" });
  }
  doc.moveTo(0, 104).lineTo(W, 104).lineWidth(1).strokeColor(LINE).stroke();

  // ── patient strip ─────────────────────────────────────────────────────
  let y = 126;
  const pair = (label: string, value: string, x: number, w: number) => {
    doc.font("Helvetica").fontSize(7.5).fillColor("#A98C98").text(label.toUpperCase(), x, y, { characterSpacing: 0.7 });
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor(PLUM_DEEP).text(value || "—", x, y + 11, { width: w });
  };
  pair("Patient", S(input.patientName), M, CONTENT * 0.42);
  pair("Age", input.patientAge ? `${input.patientAge} yrs` : "—", M + CONTENT * 0.44, CONTENT * 0.12);
  pair("Date", S(input.consultDateLabel), M + CONTENT * 0.58, CONTENT * 0.42);
  y += 34;
  doc.font("Helvetica").fontSize(8).fillColor("#A98C98").text(`Ref ${S(input.referenceCode)}`, M, y);
  y += 20;
  doc.moveTo(M, y).lineTo(W - M, y).lineWidth(0.8).strokeColor(LINE).stroke();
  y += 20;

  // ── section helper, with page-break safety ────────────────────────────
  const ensure = (need: number) => {
    if (y + need > doc.page.height - 120) {
      doc.addPage();
      y = M;
    }
  };
  const heading = (t: string) => {
    ensure(30);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(GOLD).text(t.toUpperCase(), M, y, { characterSpacing: 1 });
    y += 15;
  };
  const body = (t: string, size = 10.5) => {
    const txt = S(t);
    const h = doc.font("Helvetica").fontSize(size).heightOfString(txt, { width: CONTENT });
    ensure(h);
    doc.fillColor(PLUM_DEEP).text(txt, M, y, { width: CONTENT, lineGap: 2 });
    y = doc.y + 12;
  };

  if (input.diagnosis.trim()) {
    heading("Diagnosis");
    body(input.diagnosis);
  }

  // ── medicines ─────────────────────────────────────────────────────────
  if (input.medicines.length) {
    ensure(60);
    doc.font("Helvetica-Bold").fontSize(21).fillColor(PLUM).text("Rx", M, y - 2);
    y += 26;

    const cols = [
      { k: "name", label: "Medicine", w: CONTENT * 0.4 },
      { k: "dose", label: "Dose", w: CONTENT * 0.17 },
      { k: "frequency", label: "When", w: CONTENT * 0.2 },
      { k: "duration", label: "How long", w: CONTENT * 0.23 },
    ] as const;

    const header = () => {
      doc.rect(M, y - 5, CONTENT, 20).fill("#FBF1EE");
      let x = M + 8;
      for (const c of cols) {
        doc.font("Helvetica-Bold").fontSize(7.5).fillColor(MUTED).text(c.label.toUpperCase(), x, y, { width: c.w - 10, characterSpacing: 0.6 });
        x += c.w;
      }
      y += 20;
    };
    header();

    input.medicines.forEach((m, i) => {
      const cells = cols.map((c) => S(m[c.k]) || "—");
      const rowH = Math.max(
        ...cols.map((c, j) =>
          doc.font(j === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(10).heightOfString(cells[j], { width: c.w - 10 }),
        ),
      );
      const noteTxt = S(m.notes);
      const noteH = noteTxt ? doc.font("Helvetica-Oblique").fontSize(8.5).heightOfString(noteTxt, { width: CONTENT - 16 }) + 3 : 0;

      if (y + rowH + noteH + 14 > doc.page.height - 120) {
        doc.addPage();
        y = M;
        header();
      }

      let x = M + 8;
      cols.forEach((c, j) => {
        doc.font(j === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(10).fillColor(j === 0 ? PLUM_DEEP : MUTED)
          .text(cells[j], x, y + 4, { width: c.w - 10 });
        x += c.w;
      });
      let rowBottom = y + rowH + 8;
      if (noteTxt) {
        doc.font("Helvetica-Oblique").fontSize(8.5).fillColor(MUTED).text(noteTxt, M + 8, rowBottom, { width: CONTENT - 16 });
        rowBottom = doc.y + 4;
      }
      y = rowBottom + 4;
      if (i < input.medicines.length - 1) {
        doc.moveTo(M, y - 2).lineTo(W - M, y - 2).lineWidth(0.5).strokeColor("#F2E6E2").stroke();
      }
    });
    y += 12;
  }

  if (input.advice.trim()) {
    heading("Advice");
    body(input.advice);
  }

  if (input.followUpLabel) {
    ensure(46);
    doc.roundedRect(M, y, CONTENT, 34, 8).fill("#FBF4E9");
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#8A6A34").text("FOLLOW-UP", M + 12, y + 8, { characterSpacing: 0.8 });
    doc.font("Helvetica").fontSize(10.5).fillColor(PLUM_DEEP).text(S(input.followUpLabel), M + 90, y + 11);
    y += 48;
  }

  // ── signature + safety, pinned to the foot of the LAST page ───────────
  const footTop = doc.page.height - 116;
  if (y > footTop - 20) {
    doc.addPage();
  }
  const fy = doc.page.height - 116;
  doc.moveTo(M, fy).lineTo(W - M, fy).lineWidth(0.8).strokeColor(LINE).stroke();
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor(PLUM_DEEP).text(S(input.doctorName), M, fy + 12);
  if (input.qualifications) {
    doc.font("Helvetica").fontSize(8.5).fillColor(MUTED).text(S(input.qualifications), M, fy + 26, { width: CONTENT * 0.6 });
  }
  if (input.registrationNo) {
    doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(`Reg. No. ${S(input.registrationNo)}`, M, fy + 39);
  }
  doc.font("Helvetica").fontSize(7.5).fillColor("#9B2C2C")
    .text(
      "Take these medicines exactly as written. Tell the clinic before starting them if you are pregnant, breastfeeding or " +
        "already taking other medication, and stop and seek help for any rash, swelling or breathlessness. This prescription " +
        "is for the named patient only and is not monitored for emergencies — for anything urgent, go to your nearest " +
        `emergency department. Questions: ${S(input.supportEmail)}`,
      M,
      fy + 58,
      { width: CONTENT, lineGap: 1 },
    );

  doc.end();
  const buffer = await done;
  return { buffer, removed: allRemoved };
}
