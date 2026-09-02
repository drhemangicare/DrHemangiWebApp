import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/components/site/Lang";
import { CONDITIONS } from "@/lib/site/conditions";
import { CtaBand } from "@/components/site/sections";
import { MedicalNote } from "@/components/site/MedicalNote";

export const metadata: Metadata = {
  title: "Conditions explained",
  description:
    "PCOS, endometriosis, fibroids, irregular periods, difficulty conceiving and recurrent miscarriage — what each one actually is, which tests matter, and what the treatment options really are.",
  alternates: { canonical: "/conditions" },
};

export default function ConditionsIndex() {
  return (
    <main>
      <section className="pg-head">
        <div className="wrap">
          <div className="head mid rv">
            <span className="eyebrow c">Explained properly</span>
            <h2>The conditions, without<br />the ten-minute version</h2>
            <p className="lede">
              What each condition actually is, which tests are genuinely worth doing, what the treatment options are in
              order, and the myths that send people down the wrong path for years.
            </p>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="cond-grid">
            {CONDITIONS.map((c) => (
              <Link href={`/conditions/${c.slug}`} className="cond-card rv" key={c.slug}>
                <em><T>{c.eyebrow}</T></em>
                <h3><T>{c.name}</T></h3>
                <p>{c.tagline}</p>
              </Link>
            ))}
          </div>
          <MedicalNote />
        </div>
      </section>

      <CtaBand />
    </main>
  );
}
