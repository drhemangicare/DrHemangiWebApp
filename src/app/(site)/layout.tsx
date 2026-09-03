import type { Metadata } from "next";
import "../site.css";
import { IconSprite } from "@/components/site/IconSprite";
import { Nav, MobileCta } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Ambient, ScrollProgress, SiteEffects } from "@/components/site/SiteEffects";
import { Toaster } from "@/components/site/Toast";
import { LangProvider } from "@/components/site/Lang";
import { CareProvider } from "@/components/site/Care";
import { getCare } from "@/lib/site/settings";

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

/**
 * The default description for every public page, in the current mode.
 *
 * Lives here rather than in the root layout because the root also wraps
 * /admin, and because the sentence depends on what the clinic is offering: a
 * site with both consultation switches off must not go on telling search
 * engines to "book a private consultation, video or in-clinic". Individual
 * pages that set their own description still win.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { copy } = await getCare();
  return { description: copy.siteDescription };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  /* Read once here and share it, rather than every booking button asking. The
     settings read is request-deduped and cached, so this costs nothing beyond
     what the page already pays. */
  const { care, settings } = await getCare();

  return (
    <CareProvider care={care} supportEmail={settings.support_email}>
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
    </CareProvider>
  );
}
