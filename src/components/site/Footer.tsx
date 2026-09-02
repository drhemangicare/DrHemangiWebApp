import Link from "next/link";
import { getPublicSettings } from "@/lib/site/settings";

export async function Footer() {
  const s = await getPublicSettings();
  return (
    <footer>
      <div className="wrap">
        <div className="f-grid">
          <div>
            <div className="f-logo">
              <span className="logo-mk"><svg style={{ color: "#F2C9C4" }}><use href="#i-lotus" /></svg></span>
              <span>
                <b>Dr Hemangi</b>
                <span>Gynaecology · Fertility · Surgery</span>
              </span>
            </div>
            <p style={{ fontSize: ".87rem", lineHeight: 1.7, maxWidth: 320 }}>
              Compassionate, evidence-based women&apos;s healthcare — from adolescence through fertility, pregnancy,
              postpartum and menopause.
            </p>
            <div className="socials">
              <a href="https://instagram.com/gynaec_fact_drhemangi" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg><use href="#i-ig" /></svg>
              </a>
              <a href="/contact" aria-label="WhatsApp"><svg><use href="#i-wa" /></svg></a>
              <a href={`mailto:${s.support_email}`} aria-label={`Email ${s.support_email}`}><svg><use href="#i-mail" /></svg></a>
            </div>
          </div>

          <div>
            <h5>Care</h5>
            <div className="f-links">
              <Link prefetch={false} href="/services">Gynaecology</Link>
              <Link prefetch={false} href="/fertility">Fertility &amp; IVF</Link>
              <Link prefetch={false} href="/pregnancy">Pregnancy care</Link>
              <Link prefetch={false} href="/about">About Dr Hemangi</Link>
            </div>
            <h5 style={{ marginTop: 22 }}>Explained</h5>
            <div className="f-links">
              <Link prefetch={false} href="/conditions/pcos">PCOS</Link>
              <Link prefetch={false} href="/conditions/endometriosis">Endometriosis</Link>
              <Link prefetch={false} href="/conditions/fibroids">Fibroids</Link>
              <Link prefetch={false} href="/pregnancy">Pregnancy week by week</Link>
              <Link prefetch={false} href="/conditions/irregular-periods">Irregular periods</Link>
            </div>
          </div>

          <div>
            <h5>Clinic</h5>
            <div className="f-links">
              <Link prefetch={false} href="/about">About Dr Hemangi</Link>
              <Link prefetch={false} href="/faq">FAQ</Link>
              <Link prefetch={false} href="/book">Book consultation</Link>
              <Link prefetch={false} href="/bookings">My bookings</Link>
              <Link prefetch={false} href="/contact">Contact</Link>
            </div>
          </div>

          <div>
            <h5>Reach us</h5>
            <div className="f-links" style={{ marginBottom: 16 }}>
              <Link prefetch={false} href="/contact">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <svg style={{ width: 15, height: 15 }}><use href="#i-phone" /></svg> +91 98XXX XXXXX
                </span>
              </Link>
              {s.clinic_visit_enabled && (
                <Link prefetch={false} href="/contact">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <svg style={{ width: 15, height: 15 }}><use href="#i-pin" /></svg>{" "}
                    <span>{s.clinic_address || "Clinic address, City"}</span>
                  </span>
                </Link>
              )}
              <Link prefetch={false} href="/contact">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <svg style={{ width: 15, height: 15 }}><use href="#i-clock" /></svg>{" "}
                  <span>{s.clinic_timing || "Mon–Sat · 10 AM – 7 PM"}</span>
                </span>
              </Link>
              {/* A real mailto, not a link to the contact form: someone reporting
                  that the site is broken should not have to use the site. */}
              <a href={`mailto:${s.support_email}`}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <svg style={{ width: 15, height: 15 }}><use href="#i-mail" /></svg>{" "}
                  <span>{s.support_email}</span>
                </span>
              </a>
            </div>
            <div className="emerg">
              <b>Medical emergency?</b>
              <p>
                This site is for scheduled consultations only. For bleeding, severe pain or labour, go to your nearest
                emergency department immediately.
              </p>
            </div>
          </div>
        </div>

        <div className="f-bot">
          <span>
            © {new Date().getFullYear()} Dr Hemangi Women&apos;s Clinic. All rights reserved. · Made with{" "}
            <span style={{ color: "#E3A7A2" }}>♥</span> by Vedant
          </span>
          <span style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <Link prefetch={false} href="/privacy">Privacy</Link>
            <Link prefetch={false} href="/terms">Terms</Link>
            <Link prefetch={false} href="/refund-policy">Refund policy</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
