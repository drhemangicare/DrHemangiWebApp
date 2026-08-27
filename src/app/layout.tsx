import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

/* Fonts are self-hosted, not pulled from fonts.googleapis.com.
   A <link rel="stylesheet"> to Google Fonts is render-blocking *and* on a
   third-party origin, so the browser had to resolve DNS, negotiate TLS and
   fetch a stylesheet from another host before it could paint anything at all.
   Measured on a throttled connection: that request started at ~220ms and took
   another 225–320ms, every millisecond of it on the critical path to first
   paint. These imports are bundled into our own CSS, so that whole round trip
   disappears and the woff2 files come from our origin with immutable caching.

   `wght`, not `full`. Fraunces ships SOFT, WONK and opsz axes as well, and the
   all-axes latin file is 121KB against 36KB for weight-only. The site sets
   `SOFT 0, WONK 0` — both defaults — and never sets opsz, so the extra 85KB
   bought nothing. Both faces declare font-display:swap, so text paints in the
   fallback immediately rather than waiting on the download. */
import "@fontsource-variable/fraunces/wght.css";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource-variable/plus-jakarta-sans/wght.css";

// Root layout is deliberately style-free. The public site and the admin
// dashboard have completely separate stylesheets (site.css vs globals.css,
// imported by their own layouts) so Tailwind's preflight and the admin
// utility classes can never leak into the hand-authored site design, and
// vice versa. Next.js chunks CSS per route segment, so each area only ever
// downloads its own sheet.

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Dr Hemangi — Gynaecology, Fertility & Aesthetic Wellness",
    template: "%s · Dr Hemangi",
  },
  description:
    "Book a private consultation with Dr Hemangi — MBBS, DNB, D.G.O, FMAS Laparoscopic Surgeon, Infertility Specialist (IUI & IVF). Video or in-clinic, no account needed.",
};

/* There was an inline script here that reached into the DOM before hydration
   and stamped "already visible" attributes onto every `.rv` block inside the
   first viewport, so the top of the page would paint without waiting for
   React. It worked — it took Largest Contentful Paint on a condition page from
   3704ms to 1892ms — but it was fixing the wrong layer, and React reported it
   every time: "a tree hydrated but some attributes of the server rendered HTML
   didn't match the client properties". Mutating React-owned DOM before React
   adopts it always costs a hydration mismatch.

   The reveal animation is now built the other way round: blocks are visible by
   default and SiteEffects hides the ones still below the fold after hydration
   (see the note above `.rv` in site.css). Nothing above the fold is ever
   hidden in the first place, so there is nothing to un-hide early, and the
   paint no longer depends on JavaScript running at all. */

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">
        {children}
        {/* Both are no-ops on any host other than Vercel, so this is safe to
            ship even before the site is deployed there. Root layout, not the
            (site) layout, so admin pages are covered too. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
