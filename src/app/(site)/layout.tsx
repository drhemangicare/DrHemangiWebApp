import "../site.css";
import { IconSprite } from "@/components/site/IconSprite";
import { Nav, MobileCta } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Ambient, ScrollProgress, SiteEffects } from "@/components/site/SiteEffects";
import { Toaster } from "@/components/site/Toast";
import { LangProvider } from "@/components/site/Lang";

// Shared chrome for every public page. `site.css` is imported here rather than
// in the root layout so the admin dashboard (which uses Tailwind) never loads
// it — Next chunks CSS per route segment, so the two design systems stay
// completely separate.

/**
 * Every public page is prerendered and then refreshed at most once an hour.
 *
 * Two things this buys, and one it fixes.
 *
 * · Vercel cost. A prerendered page is served from the CDN, so an ordinary
 *   visit invokes no function at all. Only the occasional background
 *   regeneration does, which is a handful of invocations an hour for the whole
 *   site rather than one per visitor.
 * · Speed. The reader gets a file off the edge, not a render.
 * · The fix: without this the pages were prerendered *once, at build time*, so
 *   anything Dr Hemangi changed in the admin settings would never appear on the
 *   public site until the next deploy. Now the clinic address, timings and the
 *   two counters refresh on their own — and `revalidateTag` in the settings
 *   PATCH makes an edit show up immediately rather than waiting out the hour.
 *
 * An hour rather than a few minutes because this content changes rarely, and a
 * shorter window would mean more regenerations for no visible benefit.
 */
export const revalidate = 3600;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <IconSprite />
      <Ambient />
      <ScrollProgress />
      <SiteEffects />
      <div className="app">
        <Nav />
        {children}
        <Footer />
      </div>
      <MobileCta />
      <Toaster />
    </LangProvider>
  );
}
