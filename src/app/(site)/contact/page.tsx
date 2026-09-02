import type { Metadata } from "next";
import Link from "next/link";
import { ClinicVisit } from "@/components/site/sections";
import { getPublicSettings } from "@/lib/site/settings";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPublicSettings();
  return {
    title: s.clinic_visit_enabled ? "Contact & clinic visits" : "Contact",
    description: s.clinic_visit_enabled
      ? "Clinic address, timings and phone number. Online video consultations can be booked instantly; in-clinic visits are arranged directly."
      : "How to reach Dr Hemangi's clinic. Online video consultations can be booked instantly, in about two minutes.",
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const s = await getPublicSettings();
  const visits = s.clinic_visit_enabled;

  return (
    <main>
      <section className="pg-head">
        <div className="wrap">
          <div className="head mid rv">
            <span className="eyebrow c">Get in touch</span>
            <h2>Contact the clinic</h2>
            <p className="lede">
              {visits
                ? "Video consultations are booked online in about two minutes. For an in-person visit, reach out directly."
                : "Video consultations are booked online in about two minutes. Anything else, email us and we'll come back to you."}
            </p>
          </div>
        </div>
      </section>

      <ClinicVisit />

      {/* Questions and problem reports.
          Deliberately a plain mailto rather than a form: the most likely reason
          someone needs this is that something on the site is not working, and a
          form is exactly the wrong thing to hand them at that moment. It also
          means a reply lands in a normal inbox with a normal reply-to. */}
      <section id="support" style={{ paddingTop: visits ? 0 : undefined }}>
        <div className="wrap-n">
          <div className="card rv" style={{ maxWidth: 760, marginInline: "auto", padding: "clamp(24px,4vw,42px)" }}>
            <span className="eyebrow">Questions & problems</span>
            <h3 style={{ margin: "12px 0 10px" }}>Something not working, or a question about the site?</h3>
            <p className="lede" style={{ marginBottom: 20 }}>
              Email us and we&apos;ll get back to you. This address is for questions about bookings, payments and
              anything on this website that looks wrong — it is not monitored for medical advice.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <a className="btn btn-p" href={`mailto:${s.support_email}?subject=${encodeURIComponent("Question about drhemangi.in")}`}>
                <svg><use href="#i-mail" /></svg> {s.support_email}
              </a>
              <Link className="btn btn-g" href="/faq">
                Read the FAQ first <svg><use href="#i-arr" /></svg>
              </Link>
            </div>

            <div className="emerg on-light" style={{ marginTop: 26 }}>
              <b>Please don&apos;t email a medical emergency.</b>
              <p>
                Email is not monitored around the clock. For bleeding, severe pain, reduced fetal movement or labour,
                go to your nearest emergency department now.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
