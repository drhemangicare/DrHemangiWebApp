import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BookingWizard } from "@/components/site/BookingWizard";
import { getPublicSettings } from "@/lib/site/settings";

export const metadata: Metadata = {
  title: "Book a consultation",
  description: "Book a private video consultation with Dr Hemangi. No account needed — takes about two minutes.",
  alternates: { canonical: "/book" },
  robots: { index: true, follow: true },
};

export default async function BookPage() {
  const s = await getPublicSettings();
  /* ── Booking off: LEAVE, do not fail. ──────────────────────────────────
     This was `notFound()`, and that was the bug. A disabled feature is a
     valid application state, not an error, and treating it as one had a
     second, worse effect: `notFound()` renders Next's not-found boundary,
     which sits OUTSIDE the site layout's BookingEnabledProvider. The nav on
     that 404 therefore fell back to the context default and rendered "Book
     consultation" and "My bookings" — booking buttons on the very page that
     existed to say booking was unavailable, and the only way a visitor could
     reach the 404 at all.

     `redirect()` returns a 307 before anything renders, so no boundary, no
     stale flag, no error page. The visitor lands on the site. Nothing here is
     deleted — flipping the setting back on restores this page and every
     booking already in the database. */
  if (!s.online_consultation_enabled) redirect("/");
  return (
    <main>
      {/* useSearchParams (?service=fertility deep links) needs a Suspense
          boundary so the rest of the page can still be statically rendered */}
      <Suspense fallback={<section className="bk"><div className="wrap-n" /></section>}>
        <BookingWizard clinicVisits={s.clinic_visit_enabled} />
      </Suspense>
    </main>
  );
}
