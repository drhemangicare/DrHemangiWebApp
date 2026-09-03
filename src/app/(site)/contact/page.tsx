import type { Metadata } from "next";
import Link from "next/link";
import { ClinicVisit } from "@/components/site/sections";
import { getCare } from "@/lib/site/settings";

export async function generateMetadata(): Promise<Metadata> {
  const { copy } = await getCare();
  return {
    title: copy.contactTitle,
    description: copy.contactMetaDescription,
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const { care, copy, settings: s } = await getCare();

  return (
    <main>
      <section className="pg-head">
        <div className="wrap">
          <div className="head mid rv">
            <span className="eyebrow c">Get in touch</span>
            <h2>Contact the clinic</h2>
            {/* Both branches of this line used to open with "Video
                consultations are booked online in about two minutes" —
                including the branch that ran when video consultations were
                switched off. */}
            <p className="lede">{copy.contactLede}</p>
          </div>
        </div>
      </section>

      {/* Address, timings and directions. Renders only when the clinic is
          actually seeing people in person. */}
      <ClinicVisit />

      {/* ...and when it is not, this takes its place — email only.
          The card that used to sit here listed a phone number, opening hours
          and an Instagram handle beside the address block it replaced, which
          missed the point of the switch: with in-person visits off, a phone
          number and a set of opening hours are still an invitation to turn up
          or ring a door that is closed. One channel remains, so the page
          offers one channel.

          It also absorbs the "questions & problems" card that used to follow
          it. Two cards, both centred on the same mailto, read as a mistake. */}
      {!care.clinic && (
        <section id="reach">
          <div className="wrap-n">
            <div className="head mid rv">
              {/* Not a second "Contact the clinic" — the page heading already
                  said that. This one earns its place by saying what the inbox
                  actually covers. */}
              <span className="eyebrow c">Reach us</span>
              <h2>One inbox, read by the clinic</h2>
              <p className="lede">
                {care.online
                  ? "Everything to do with a video consultation is handled here on the site. Anything else — your records, a report, a question about care, or something on this website that looks wrong — goes to the address below."
                  : "Questions about care, your records, your reports, or anything on this website that looks wrong all go to the same address, and are answered on working days."}
              </p>
            </div>
            <div className="card rv" style={{ maxWidth: 560, marginInline: "auto", padding: "clamp(24px,4vw,42px)" }}>
              {/* Centred, because the heading above it is. A left-aligned pair
                  of buttons under a centred heading reads as a card that lost
                  its right-hand column. */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
                <a
                  className="btn btn-p"
                  href={`mailto:${s.support_email}?subject=${encodeURIComponent("Question for Dr Hemangi's clinic")}`}
                >
                  <svg><use href="#i-mail" /></svg> {s.support_email}
                </a>
                {care.booking ? (
                  <Link className="btn btn-g" href="/book">
                    Book a video consultation <svg><use href="#i-arr" /></svg>
                  </Link>
                ) : (
                  <Link className="btn btn-g" href="/faq">
                    Read the FAQ first <svg><use href="#i-arr" /></svg>
                  </Link>
                )}
              </div>

              <div className="emerg on-light" style={{ marginTop: 26 }}>
                <b>Please don&apos;t email a medical emergency.</b>
                <p>
                  Email is not monitored around the clock. For bleeding, severe pain, reduced fetal movement or
                  labour, go to your nearest emergency department now.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Questions and problem reports — only while the clinic block above is
          carrying the address, timings and phone. With in-person visits off it
          is folded into the single email card above instead.

          Deliberately a plain mailto rather than a form: the most likely reason
          someone needs this is that something on the site is not working, and a
          form is exactly the wrong thing to hand them at that moment. It also
          means a reply lands in a normal inbox with a normal reply-to. */}
      {care.clinic && (
        <section id="support" style={{ paddingTop: 0 }}>
          <div className="wrap-n">
            <div className="card rv" style={{ maxWidth: 760, marginInline: "auto", padding: "clamp(24px,4vw,42px)" }}>
              <span className="eyebrow">Questions &amp; problems</span>
              <h3 style={{ margin: "12px 0 10px" }}>Something not working, or a question about the site?</h3>
              <p className="lede" style={{ marginBottom: 20 }}>
                {care.booking
                  ? "Email us and we'll get back to you. This address is for questions about bookings, payments and anything on this website that looks wrong — it is not monitored for medical advice."
                  : "Email us and we'll get back to you. This address is for questions about your records, your reports and anything on this website that looks wrong — it is not monitored for medical advice."}
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
                  Email is not monitored around the clock. For bleeding, severe pain, reduced fetal movement or
                  labour, go to your nearest emergency department now.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

    </main>
  );
}
