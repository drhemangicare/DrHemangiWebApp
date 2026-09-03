import Link from "next/link";
import { getCare } from "@/lib/site/settings";

/**
 * The public site's 404.
 *
 * Two reasons this file exists rather than leaning on Next's built-in page.
 *
 * 1. The default not-found renders bare — the screenshot that started this
 *    work showed Next's own "404 | This page could not be found." floating in
 *    the middle of the site chrome, which reads as a crash rather than a
 *    mistyped URL.
 * 2. Correctness, and this is the important one. A `not-found.tsx` inside the
 *    (site) group renders INSIDE that group's layout, so it sits within the
 *    BookingEnabledProvider and sees the real flag. The built-in boundary does
 *    not, which is how booking buttons appeared on a 404 while booking was
 *    switched off.
 *
 * The onward links are chosen so this page is useful whether or not booking is
 * on, and it never offers a route that the flag has withdrawn.
 */
export default async function SiteNotFound() {
  const { care, copy } = await getCare();

  return (
    <main>
      <section className="pg-head">
        <div className="wrap">
          <div className="head mid">
            <span className="eyebrow c">That page has moved, or never existed</span>
            <h2>
              We couldn&apos;t find
              <br />
              <em className="it">that page.</em>
            </h2>
            <p className="lede">
              Nothing is wrong with your connection — the address just doesn&apos;t match anything on the site. Here
              is where most people are heading.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 28 }}>
              {care.booking ? (
                <Link className="btn btn-p btn-lg" href="/book">
                  Book a consultation <svg><use href="#i-arr" /></svg>
                </Link>
              ) : (
                <Link className="btn btn-p btn-lg" href={copy.heroPrimary.href}>
                  {copy.heroPrimary.label} <svg><use href="#i-arr" /></svg>
                </Link>
              )}
              <Link className="btn btn-g btn-lg" href="/">Back to the home page</Link>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 14 }}>
              <Link className="btn btn-g" href="/conditions">Conditions we treat</Link>
              <Link className="btn btn-g" href="/pregnancy">Pregnancy care</Link>
              <Link className="btn btn-g" href="/services">All services</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
