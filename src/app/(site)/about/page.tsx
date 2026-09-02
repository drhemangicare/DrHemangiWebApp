import type { Metadata } from "next";
import { AboutDoctor, Marquee, CtaBand } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "About Dr Hemangi",
  description:
    "MBBS, DNB (Obs & Gynae), D.G.O, FMAS-certified minimal access surgeon and infertility specialist practising across fertility, high-risk obstetrics and women's wellness.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main>
      <section className="pg-head">
        <div className="wrap">
          <div className="head mid rv">
            <span className="eyebrow c">About the doctor</span>
            <h2>One doctor, every stage</h2>
            <p className="lede">
              The person who guided your first cycle is the same one who holds your hand at delivery, and checks in six
              weeks after.
            </p>
          </div>
        </div>
      </section>
      <Marquee />
      <AboutDoctor />
      <CtaBand />
    </main>
  );
}
