import Link from "next/link";
import { Hero } from "@/components/site/Hero";
import { ChapterScroller } from "@/components/site/ChapterScroller";
import { FaqList } from "@/components/site/FaqList";
import { Marquee, ServicesGrid, FertilitySpotlight, HowItWorks, AboutDoctor, ClinicVisit, CtaBand } from "@/components/site/sections";
import { getCare } from "@/lib/site/settings";

export default async function LandingPage() {
  const { copy, settings: s } = await getCare();
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
            <p className="lede">{copy.servicesLede}</p>
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

      {/* Address, timings and directions, when the clinic is seeing people in
          person. It belongs here and the comment on the component always said
          so, but it was only ever imported by /contact — so switching
          in-person visits on or off changed nothing at all on the landing
          page, which is the page most visitors only ever see. */}
      <ClinicVisit />

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
