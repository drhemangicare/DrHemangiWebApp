"use client";
import { useState } from "react";

/**
 * The doctor's photo, with the placeholder silhouette as a real fallback.
 *
 * This exists because "the photo is not visible" has two completely different
 * causes and the old markup could not tell them apart:
 *
 *   · `doctor_photo_url` is null — nothing was ever recorded in the database,
 *     so the silhouette renders. That is the settings/upload path.
 *   · `doctor_photo_url` is a URL that does not load — the object was removed,
 *     or the `site-assets` bucket is not actually public (migration 0002
 *     creates it public, but `on conflict do nothing` means a bucket someone
 *     had already made by hand keeps whatever visibility it was made with).
 *     Supabase's `getPublicUrl()` happily returns a URL for a private bucket;
 *     it just 400s when fetched.
 *
 * In the second case the old `<img>` had no error handling, so the page showed
 * a blank pink card — worse than the placeholder, because it looks like a
 * layout bug rather than a missing photo. `onError` now falls back to the
 * silhouette, so the page always looks deliberate.
 */
export function DoctorPhoto({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="Dr Hemangi"
        onError={() => setFailed(true)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
      />
    );
  }
  return (
    <svg
      viewBox="0 0 200 240"
      fill="none"
      stroke="#4A1F35"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity=".55"
    >
      <circle cx="100" cy="76" r="34" />
      <path d="M100 110c-30 0-52 20-58 48-2 9-3 20-3 30h122c0-10-1-21-3-30-6-28-28-48-58-48z" />
      <path d="M78 118c6 14 13 22 22 22s16-8 22-22" />
      <path d="M100 140v34M92 156h16" />
      <path d="M66 62c4-18 18-28 34-28s30 10 34 28" />
    </svg>
  );
}
