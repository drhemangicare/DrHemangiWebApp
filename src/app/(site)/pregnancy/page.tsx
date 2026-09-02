import type { Metadata } from "next";
import Link from "next/link";
import { TRIMESTERS, TRI_SLUGS } from "@/lib/site/pregnancy";
import { FetalStageArt } from "@/components/site/FetalStage";
import { PregnancyJourney } from "@/components/site/PregnancyJourney";
import { WeekExplorer } from "@/components/site/WeekExplorer";
import { MedicalNote } from "@/components/site/MedicalNote";
import { InfoNote } from "@/components/site/InfoNote";
import { T } from "@/components/site/Lang";
import { CtaBand } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Pregnancy, week by week",
  description:
    "Watch your baby grow from a ball of cells to a full-term baby. The eight milestones that matter, the scans and checks that belong to each, and a scrubber to find your own week — explained plainly by Dr Hemangi.",
  alternates: { canonical: "/pregnancy" },
};

export default function PregnancyIndex() {
  return (
    <main>
      <section className="pg-head">
        <div className="wrap">
          <div className="cont-grid">
            <div className="rv">
              <span className="eyebrow"><T>Week by week</T></span>
              <h2 style={{ margin: "14px 0 16px" }}><T>Forty weeks, one story</T></h2>
              <p className="lede">
                <T>Scroll, and watch your baby grow. What is being built at each stage, what your body is doing, and which scan or check belongs to that point — without the panic-inducing forums.</T>
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 26 }}>
                <Link className="btn btn-p" href="#journey">
                  <T>Start the journey</T> <svg><use href="#i-arr" /></svg>
                </Link>
                <Link className="btn btn-g" href="#my-week"><T>Find my week</T></Link>
              </div>
            </div>
            <div className="rv" data-d="1">
              <FetalStageArt week={20} uid="hub" />
              <InfoNote kind="art" />
            </div>
          </div>
        </div>
      </section>

      <PregnancyJourney />

      <section id="my-week" style={{ paddingTop: "clamp(20px,3vw,44px)" }}>
        <div className="wrap">
          <div className="rv">
            <WeekExplorer />
          </div>

          <div className="tri-band rv" style={{ marginTop: "clamp(34px,4.5vw,56px)" }}>
            {TRIMESTERS.map((t, i) => (
              <Link className="tri" key={t.n} href={`/pregnancy/${TRI_SLUGS[i]}`}>
                <span><T>Weeks</T> {t.weeks[0]}–{t.weeks[1]}</span>
                <b><T>{t.label}</T></b>
                <p><T>{t.blurb}</T></p>
                <em><T>Read this trimester</T> <svg><use href="#i-arr" /></svg></em>
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
