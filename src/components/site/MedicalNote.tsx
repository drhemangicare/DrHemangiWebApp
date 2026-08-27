"use client";
import { REVIEW } from "@/lib/site/conditions";
import { useLang } from "./Lang";

/**
 * Shown at the foot of every clinical page. Two jobs: make clear this is
 * education rather than diagnosis, and carry the clinical-review line. Until
 * REVIEW.reviewed is flipped to true it says so plainly rather than implying a
 * sign-off that hasn't happened.
 *
 * The body is one whole sentence per translation key rather than a sentence
 * assembled from fragments — fragment-stitching produces word order that is
 * wrong in every language except the one it was written in.
 */
export function MedicalNote() {
  const { t } = useLang();
  return (
    <p className="med-note">
      <b>{t("This page is general information, not medical advice.")}</b>{" "}
      {t("Nothing here can diagnose you or replace an assessment of your own history, examination and results. If something here matches what you are experiencing, the next step is a consultation — not a conclusion. If you are in severe pain, bleeding heavily, or feel unwell, seek urgent care rather than waiting for an appointment.")}
      {REVIEW.reviewed ? (
        <> {t("Clinically reviewed by")} {REVIEW.reviewer}{REVIEW.reviewedOn ? ` · ${REVIEW.reviewedOn}` : ""}.</>
      ) : (
        <> {t("Awaiting final clinical review before publication.")}</>
      )}
    </p>
  );
}
