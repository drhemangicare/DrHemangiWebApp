import type { Metadata } from "next";
import { FertilitySpotlight, HowItWorks, CtaBand } from "@/components/site/sections";
import { FaqList } from "@/components/site/FaqList";

export const metadata: Metadata = {
  title: "Fertility, IUI & IVF",
  description:
    "Fertility workup for both partners, ovulation induction, IUI and IVF planning, diagnostic and operative laparoscopy with an FMAS-certified surgeon.",
  alternates: { canonical: "/fertility" },
};

export default function FertilityPage() {
  return (
    <main>
      <section className="pg-head">
        <div className="wrap">
          <div className="head mid rv">
            <span className="eyebrow c">Infertility · IUI · IVF</span>
            <h2>A plan, not a waiting game</h2>
            <p className="lede">
              Structural causes found early by a laparoscopic surgeon, and escalation to IUI or IVF only when it
              genuinely improves your odds.
            </p>
          </div>
        </div>
      </section>
      <FertilitySpotlight />
      <HowItWorks />
      <section id="faq">
        <div className="wrap">
          <div className="head mid rv">
            <span className="eyebrow c">Good to know</span>
            <h2>Common questions</h2>
          </div>
          <FaqList />
        </div>
      </section>
      <CtaBand />
    </main>
  );
}
