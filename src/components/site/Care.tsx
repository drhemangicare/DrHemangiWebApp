"use client";
import { createContext, useContext } from "react";
import { CARE_CLOSED, careCopy, type Care, type CareCopy } from "@/lib/site/care";

/**
 * Which kinds of consultation the clinic offers, for the CLIENT half of the
 * site. Replaces the old boolean `BookingEnabled` context, which could only
 * answer "is the booking wizard reachable" — not "does this clinic see anyone
 * at all", which is what the copy needs to know.
 *
 * The value is resolved once per render on the server (in the site layout) and
 * handed down, rather than each component fetching it. Server components that
 * need it — pages, sections — call `getCare()` directly; this context exists
 * so that `Nav`, `Hero`, `FaqList` and `ChapterScroller` see the same answer
 * without a second round trip or a hydration mismatch.
 *
 * ── THE DEFAULT IS "CLOSED", AND THAT IS DELIBERATE ───────────────────────
 * This default is what a component sees when it renders OUTSIDE the provider,
 * which happens on error and not-found boundaries. It used to be `true`, and
 * that is exactly how booking buttons leaked onto the 404 page while the
 * feature was switched off. For a feature flag the safe answer to "I do not
 * know" is "do not offer it": a missing button is a cosmetic gap, a button
 * leading to a feature that is off is a broken journey.
 *
 * This is NOT the same decision as the database fallback in settings.ts, which
 * stays TRUE. There, "I could not read the setting" must not silently take a
 * working clinic offline. Here, "I am rendering outside the app shell"
 * genuinely means we have no answer. Different questions, different defaults.
 *
 * The support email travels with it because several copy strings embed it, and
 * a client component has no other way to reach a server setting.
 */
type CareContextValue = { care: Care; copy: CareCopy; supportEmail: string };

const FALLBACK_EMAIL = "hello@drhemangi.in";

const CareContext = createContext<CareContextValue>({
  care: CARE_CLOSED,
  copy: careCopy(CARE_CLOSED, FALLBACK_EMAIL),
  supportEmail: FALLBACK_EMAIL,
});

export function CareProvider({
  care,
  supportEmail,
  children,
}: {
  care: Care;
  supportEmail: string;
  children: React.ReactNode;
}) {
  return (
    <CareContext.Provider value={{ care, copy: careCopy(care, supportEmail), supportEmail }}>
      {children}
    </CareContext.Provider>
  );
}

export function useCare(): CareContextValue {
  return useContext(CareContext);
}
