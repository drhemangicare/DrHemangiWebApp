import type { Metadata } from "next";
import { FaqList } from "@/components/site/FaqList";
import { CtaBand } from "@/components/site/sections";
import { FAQS } from "@/lib/site/content";

export const metadata: Metadata = {
  title: "FAQ",
  description: "How booking, video consultations, payments, rescheduling, privacy and prescriptions work at Dr Hemangi's clinic.",
  alternates: { canonical: "/faq" },
};

// Structured data so the questions can surface directly in search results.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(([q, a]) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function FaqPage() {
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
