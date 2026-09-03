import type { Metadata } from "next";
import { FaqList } from "@/components/site/FaqList";
import { CtaBand } from "@/components/site/sections";
import { faqsFor } from "@/lib/site/content";
import { getCare } from "@/lib/site/settings";

export async function generateMetadata(): Promise<Metadata> {
  const { care } = await getCare();
  const description =
    care.booking
      ? "How booking, video consultations, payments, rescheduling, privacy and prescriptions work at Dr Hemangi's clinic."
      : care.clinic
        ? "How appointments, timings, records, privacy and prescriptions work at Dr Hemangi's clinic."
        : "How to reach Dr Hemangi's clinic, how records and privacy are handled, and what to do in an emergency.";
  return { title: "FAQ", description, alternates: { canonical: "/faq" } };
}

export default async function FaqPage() {
  /* The structured data has to be filtered the same way the visible list is.
     Publishing FAQPage markup about paying for a video consultation, on a site
     that does not sell one, puts the wrong answer straight into search
     results — and unlike the page itself, nobody sees it to notice. */
  const { care } = await getCare();
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqsFor(care.mode).map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <section className="pg-head">
        <div className="wrap">
          <div className="head mid rv">
            <span className="eyebrow c">Good to know</span>
            <h2>Questions people actually ask</h2>
          </div>
        </div>
      </section>
      <section style={{ paddingTop: 0 }}>
        <div className="wrap"><FaqList /></div>
      </section>
      <CtaBand />
    </main>
  );
}
