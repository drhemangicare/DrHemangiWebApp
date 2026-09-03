/**
 * Real ultrasound images, supplied by the clinic.
 *
 * WHY THIS FILE EXISTS
 * The scan view used to be a *drawing* of an ultrasound. It never convinced
 * anyone — a real sonogram is a grainy slice through one part of the baby, not
 * a tidy full-body silhouette, and the drawn version was reported from the live
 * site as "not looking original". No amount of drawing fixes that, because the
 * thing that makes a scan look like a scan is that it is a photograph of sound.
 *
 * So the scan view now shows real images or it shows nothing at all. Until this
 * list has entries the toggle does not appear anywhere on the site, and the
 * illustration is the only view. That is deliberate: a convincing fake scan on
 * a doctor's website is worse than no scan, because a patient will compare it
 * with her own.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ADDING A SCAN — Dr Hemangi, please read all four points.
 *
 * 1. CONSENT. Written consent from the patient for use of her scan image on a
 *    public website, kept on file. Verbal consent is not enough for publication.
 * 2. DE-IDENTIFY. Ultrasound machines burn the patient name, hospital ID and
 *    date into the top of the image. Crop that band off completely before the
 *    file leaves the clinic — do not cover it with a box, crop it, because a
 *    box can be removed from the file. Check the corners too.
 * 3. STRIP METADATA. Export as JPEG or PNG and remove EXIF/DICOM tags. A DICOM
 *    file straight off the machine carries the full patient record inside it
 *    and must never be uploaded.
 * 4. NAME IT BY WEEK. Put the file in `public/scans/` as `week-20.jpg` and add
 *    the entry below. The `week` is the gestational age at the scan.
 *
 * A handful is plenty — one per trimester already covers the journey. Three
 * good images (around 12, 20 and 32 weeks) are worth more than twenty.
 */

export type RealScan = {
  /** Gestational age in completed weeks at the time of the scan. */
  week: number;
  /** Path under /public, e.g. "/scans/week-20.jpg". */
  src: string;
  /** Intrinsic pixel size, so the layout reserves the right box (no CLS). */
  width: number;
  height: number;
  /** What the viewer is looking at: "Profile at 20 weeks", "Spine and ribs". */
  alt: string;
  /** Optional one-line note shown under the image. */
  note?: string;
};

/**
 * Empty on purpose. See the header — the scan toggle stays hidden until a real
 * image exists, and no drawn substitute is ever shown in its place.
 *
 * Example of a filled entry:
 *   { week: 20, src: "/scans/week-20.jpg", width: 800, height: 600,
 *     alt: "Profile view at twenty weeks — forehead, nose and chin",
 *     note: "The anomaly scan. Every organ is checked at this visit." },
 */
export const REAL_SCANS: RealScan[] = [];

export const hasRealScans = () => REAL_SCANS.length > 0;

/**
 * The scan to show for a given week: the closest one available.
 *
 * Closest rather than exact, because the clinic will supply a handful of images
 * and the reader can be on any of forty weeks. The caller must display the
 * returned scan's OWN week, never the week that was asked for — labelling a
 * 20-week image as week 27 would be a straightforward falsehood.
 */
export function scanFor(week: number): RealScan | null {
  if (!REAL_SCANS.length) return null;
  return REAL_SCANS.reduce((best, s) =>
    Math.abs(s.week - week) < Math.abs(best.week - week) ? s : best);
}
