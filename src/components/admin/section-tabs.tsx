"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Tabs for screens that belong to one job but live at separate routes.
 *
 * Used to fold "Pricing" and "Discounts" into a single sidebar entry without
 * rewriting either page or losing a URL. The sidebar answers "what am I
 * working on"; these answer "which part of it" — which is the distinction the
 * old flat menu was missing.
 */
export function SectionTabs({ tabs }: { tabs: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <div className="inline-flex gap-1 p-1 rounded-full bg-plum/[0.06] mb-6">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              active ? "bg-white text-plum-deep shadow-sm" : "text-muted hover:text-plum-deep"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

export const PRICING_TABS = [
  { href: "/admin/categories", label: "Services & prices" },
  { href: "/admin/discounts", label: "Discount codes" },
];
