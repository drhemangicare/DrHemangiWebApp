import type { MetadataRoute } from "next";
import { CONDITIONS } from "@/lib/site/conditions";
import { TRI_SLUGS } from "@/lib/site/pregnancy";
import { getPublicSettings } from "@/lib/site/settings";

// The site went from 3 JS-toggled screens to real URLs. The pregnancy section
// is deliberately four pages rather than forty: the week-by-week detail lives in
// a scrubber on /pregnancy, which is how patients actually use it.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { online_consultation_enabled } = await getPublicSettings();
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const at = (p: string, priority: number, freq: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly") => ({
    url: `${base}${p}`,
    lastModified: new Date(),
    changeFrequency: freq,
    priority,
  });

  return [
    at("/", 1, "weekly"),
    /* Only advertise /book while booking is on — otherwise the sitemap keeps
       inviting search engines to a 404. */
    ...(online_consultation_enabled ? [at("/book", 0.9, "weekly")] : []),
    at("/conditions", 0.8),
    at("/pregnancy", 0.8),
    at("/services", 0.7),
    at("/fertility", 0.7),
    at("/about", 0.6),
    at("/faq", 0.6),
    at("/contact", 0.5),
    at("/privacy", 0.2, "yearly"),
    at("/terms", 0.2, "yearly"),
    at("/refund-policy", 0.2, "yearly"),
    ...CONDITIONS.map((c) => at(`/conditions/${c.slug}`, 0.75)),
    ...TRI_SLUGS.map((t) => at(`/pregnancy/${t}`, 0.7)),
    // /bookings is intentionally excluded — it is noindex patient records.
  ];
}
