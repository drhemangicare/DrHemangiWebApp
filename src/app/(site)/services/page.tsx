import type { Metadata } from "next";
import { ServicesGrid, CtaBand, Marquee } from "@/components/site/sections";
import { getCare } from "@/lib/site/settings";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Menstrual & PCOS care, fertility and conception, pregnancy and antenatal, laparoscopic surgery, postpartum and menopause, preventive screening.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  /* "Every consultation is 25-40 minutes" is a promise about an appointment.
     It was hard-coded, so it survived both switches being turned off. */
  const { copy } = await getCare();
  return (
    <main>
      <section className="pg-head">
        <div className="wrap">
          <div className="head mid rv">
            <span className="eyebrow c">What we treat</span>
            <h2>Gynaecology, without the<br />rushed ten minutes</h2>
            <p className="lede">{copy.servicesLede}</p>
          </div>
        </div>
      </section>
      <Marquee />
      <section>
        <div className="wrap"><ServicesGrid /></div>
      </section>
      <CtaBand />
    </main>
  );
}
