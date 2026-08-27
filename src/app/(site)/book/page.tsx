import type { Metadata } from "next";
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
