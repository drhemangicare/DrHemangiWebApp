import { T } from "./Lang";

/**
 * The "this is a picture, not a measurement" line.
 *
 * Every number on these pages — a length in centimetres, a weight in grams, a
 * fruit the size of your baby — is a population average. Printed next to a
 * drawing it reads like a reading taken off a scan, and a patient whose scan
 * says something different will worry. One short line under each figure fixes
 * that, and it belongs everywhere a number or an illustration appears.
 */
export function InfoNote({ kind = "size" }: { kind?: "size" | "art" | "general" }) {
  const text =
    kind === "size"
      ? "For general understanding only. Lengths, weights and size comparisons are typical averages — your baby may be bigger or smaller and still be perfectly healthy. Only your own scan can tell you where yours is."
      : kind === "art"
        ? "For general understanding only. These are drawings, including the ultrasound view — they are built from typical measurements to explain the idea, and are not real scan images or a picture of your own baby."
        : "For general understanding only — not a diagnosis, and not a measurement of your own pregnancy.";
  return (
    <p className="info-note">
      <svg aria-hidden="true"><use href="#i-note" /></svg>
      <span><T>{text}</T></span>
    </p>
  );
}
