import Link from "next/link";
import { Hero } from "@/components/site/Hero";
import { ChapterScroller } from "@/components/site/ChapterScroller";
import { FaqList } from "@/components/site/FaqList";
import { Marquee, ServicesGrid, FertilitySpotlight, HowItWorks, AboutDoctor, CtaBand } from "@/components/site/sections";
import { getPublicSettings } from "@/lib/site/settings";

export default async function LandingPage() {
  const s = await getPublicSettings();
  return (
    <main>
      <Hero years={s.years_experience ?? 5} deliveries={s.deliveries_count ?? 7000} />
      <Marquee />
      <ChapterScroller />

      <section id="services">
        <div className="wrap">
          <div className="head rv">
            <span className="eyebrow">What we treat</span>
            <h2>Gynaecology, without the<br />rushed ten minutes</h2>
            <p className="lede">
              Every consultation is 25–40 minutes. Long enough to actually explain the why, not just hand over a
              prescription.
            </p>
          </div>
          {/* teaser — the full list lives on /services */}
          <ServicesGrid limit={3} />
          <div style={{ textAlign: "center", marginTop: 34 }}>
            <Link className="btn btn-g" href="/services">
              See everything we treat <svg><use href="#i-arr" /></svg>
            </Link>
          </div>
        </div>
      </section>

      <FertilitySpotlight />
      <HowItWorks />
      <AboutDoctor />

      <section id="faq">
        <div className="wrap">
          <div className="head mid rv">
            <span className="eyebrow c">Good to know</span>
            <h2>Questions people actually ask</h2>
          </div>
          <FaqList limit={4} />
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <Link className="btn btn-g" href="/faq">
              All questions <svg><use href="#i-arr" /></svg>
            </Link>
          </div>
        </div>
      </section>

      <CtaBand />
    </main>
  );
}
