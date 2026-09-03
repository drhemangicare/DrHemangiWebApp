"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type IconProps = { className?: string };

/* Line icons drawn to match the public site's SVG symbol set (1.6 stroke,
   round caps). The nav previously used emoji, which render at different
   sizes and colours on every OS and made the menu look unfinished. */
const Icon = {
  overview: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 19V11M9.5 19V5M15 19v-6M20.5 19V8" />
    </svg>
  ),
  bookings: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  ),
  pricing: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="3" />
      <path d="M2.5 10h19M6 14.5h4" />
    </svg>
  ),
  discounts: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12.6 3H20a1 1 0 0 1 1 1v7.4a2 2 0 0 1-.6 1.4l-7.6 7.6a2 2 0 0 1-2.8 0l-6-6a2 2 0 0 1 0-2.8l7.6-7.6A2 2 0 0 1 12.6 3z" />
      <path d="M16.5 7.5h.01" />
    </svg>
  ),
  availability: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  ),
  patients: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0" />
      <path d="M16.5 6.2a3.2 3.2 0 0 1 0 6.1M18.2 20a6.3 6.3 0 0 0-2.1-4.7" />
    </svg>
  ),
  settings: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
    </svg>
  ),
};

/* The sidebar holds WORKFLOWS, not every screen.
   "Patients" was added without the menu getting longer, because Pricing and
   Discounts were two entries for one job — deciding what a consultation costs
   — and are now two tabs on a single "Services & pricing" page. Discounts
   without prices beside them was never a task anyone actually had.
   Six items in, six items out, and the one that was missing is now here. */
const NAV = [
  { href: "/admin", label: "Overview", icon: Icon.overview },
  { href: "/admin/bookings", label: "Bookings", icon: Icon.bookings },
  { href: "/admin/patients", label: "Patients", icon: Icon.patients },
  { href: "/admin/categories", label: "Services & pricing", icon: Icon.pricing },
  { href: "/admin/availability", label: "Availability", icon: Icon.availability },
  { href: "/admin/settings", label: "Settings", icon: Icon.settings },
] as const;

/* /admin/discounts is a TAB of the pricing section, not its own destination,
   so it has to light up the same sidebar entry — otherwise switching tabs
   makes the menu look like it lost your place. */
const ALIASES: Record<string, string[]> = {
  "/admin/categories": ["/admin/discounts"],
};

function isActive(href: string, pathname: string | null) {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";
  if (pathname.startsWith(href)) return true;
  return (ALIASES[href] || []).some((alias) => pathname.startsWith(alias));
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="grid place-items-center w-9 h-9 rounded-xl bg-white/10 text-blush font-serif text-lg shrink-0">H</div>
      <div className="min-w-0">
        <div className="font-serif text-[0.95rem] text-white leading-tight truncate">Dr Hemangi</div>
        {!compact && <div className="text-[10px] tracking-[0.18em] uppercase text-gold-soft leading-tight">Admin</div>}
      </div>
    </div>
  );
}

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the route changes, otherwise tapping a
  // link leaves the panel covering the page you just navigated to.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Don't let the page behind the drawer scroll while it's open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function signOut() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  /* Warm every section as soon as the shell mounts. There are six, they are
     the only routes in the product, and doing it here means a click paints
     from cache instead of waiting on a round trip. `<Link prefetch>` alone
     would not do it for the drawer links, which are unmounted until the
     drawer opens. */
  useEffect(() => {
    for (const item of NAV) router.prefetch(item.href);
  }, [router]);

  const current = NAV.find((item) => isActive(item.href, pathname));

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition ${
      active ? "bg-white/12 text-white font-semibold" : "text-white/65 hover:bg-white/6 hover:text-white"
    }`;

  return (
    <>
      {/* ── Mobile: sticky top bar + drawer ── */}
      <div className="md:hidden sticky top-0 z-40">
        <div className="flex items-center justify-between gap-3 h-14 px-4 bg-plum-deep text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid place-items-center w-9 h-9 rounded-xl bg-white/10 text-blush font-serif text-lg shrink-0">H</div>
            <div className="min-w-0">
              <div className="text-[10px] tracking-[0.16em] uppercase text-gold-soft leading-tight">Admin</div>
              <div className="font-serif text-[0.95rem] leading-tight truncate">{current?.label ?? "Dr Hemangi"}</div>
            </div>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid place-items-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 transition shrink-0"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {open ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {open && (
          <>
            <button
              aria-hidden
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="fixed inset-0 top-14 bg-plum-deep/40 backdrop-blur-sm"
            />
            <nav className="relative bg-plum-deep border-t border-white/10 px-3 py-3 shadow-xl">
              <div className="grid grid-cols-2 gap-1.5">
                {NAV.map((item) => {
                  const active = isActive(item.href, pathname);
                  const ItemIcon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} className={linkClass(active)}>
                      <ItemIcon className="w-[18px] h-[18px] shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-white/10">
                <span className="text-xs text-white/50 truncate">{adminName}</span>
                <button
                  onClick={signOut}
                  className="text-xs px-3.5 py-2 rounded-lg bg-white/8 hover:bg-white/15 text-white/80 transition shrink-0"
                >
                  Sign out
                </button>
              </div>
            </nav>
          </>
        )}
      </div>

      {/* ── Desktop: fixed-height sidebar ── */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 bg-plum-deep text-white/80 md:sticky md:top-0 md:h-screen">
        <div className="p-5">
          <Brand />
        </div>
        <nav className="flex flex-col gap-1 px-3 flex-1 overflow-y-auto no-scrollbar">
          {NAV.map((item) => {
            const active = isActive(item.href, pathname);
            const ItemIcon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={linkClass(active)}>
                <ItemIcon className="w-[18px] h-[18px] shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-white/50 mb-2 truncate">{adminName}</div>
          <button
            onClick={signOut}
            className="w-full text-left text-xs px-3 py-2 rounded-lg bg-white/6 hover:bg-white/12 text-white/70 transition"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
