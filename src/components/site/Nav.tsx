"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "./Lang";

/**
 * Site navigation.
 *
 * The flat bar had run out of room: Conditions, Pregnancy, Services and
 * Fertility fitted, and About / FAQ / Contact were reachable only from the
 * burger — even on a 27-inch screen. Everything now lives in four labelled
 * groups that open as dropdowns, which is also how a visitor discovers the
 * individual condition pages without having to land on the hub first.
 *
 * Dropdowns open on hover *and* on click, close on Escape, on outside click and
 * on navigation, and are removed from the tab order while closed.
 */

type Item = { href: string; label: string; desc?: string };
type Group = { key: string; label: string; href: string; items: Item[] };

const MENU: Group[] = [
  {
    key: "conditions",
    label: "Conditions",
    href: "/conditions",
    items: [
      { href: "/conditions/pcos", label: "PCOS", desc: "Hormones, cycles and the cyst myth" },
      { href: "/conditions/endometriosis", label: "Endometriosis", desc: "Period pain that isn't normal" },
      { href: "/conditions/fibroids", label: "Uterine fibroids", desc: "Heavy bleeding and pressure" },
      { href: "/conditions/irregular-periods", label: "Irregular periods", desc: "A symptom, never a diagnosis" },
      { href: "/conditions/difficulty-conceiving", label: "Difficulty conceiving", desc: "When to stop waiting" },
      { href: "/conditions/recurrent-miscarriage", label: "Recurrent miscarriage", desc: "It is not your fault" },
      { href: "/conditions", label: "All conditions →" },
    ],
  },
  {
    key: "pregnancy",
    label: "Pregnancy",
    href: "/pregnancy",
    items: [
      { href: "/pregnancy", label: "The 40-week journey", desc: "Watch your baby grow, week by week" },
      { href: "/pregnancy/first-trimester", label: "First trimester", desc: "Weeks 1–13 · everything is being built" },
      { href: "/pregnancy/second-trimester", label: "Second trimester", desc: "Weeks 14–27 · the kindest stretch" },
      { href: "/pregnancy/third-trimester", label: "Third trimester", desc: "Weeks 28–40 · growth and preparation" },
    ],
  },
  {
    key: "care",
    label: "Care",
    href: "/services",
    items: [
      { href: "/services", label: "All services", desc: "Consultations, surgery, antenatal care" },
      { href: "/fertility", label: "Fertility & IVF", desc: "Investigation through to treatment" },
    ],
  },
  {
    key: "clinic",
    label: "Clinic",
    href: "/about",
    items: [
      { href: "/about", label: "About Dr Hemangi", desc: "Training, approach, credentials" },
      { href: "/faq", label: "FAQ", desc: "Fees, timings, how consultations work" },
      { href: "/contact", label: "Contact & directions" },
      { href: "/bookings", label: "My bookings", desc: "Reschedule or cancel a visit" },
    ],
  },
];

export function Nav() {
  const pathname = usePathname();
  const { t } = useLang();
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);               // mobile drawer
  const [menu, setMenu] = useState<string | null>(null); // open dropdown key
  const [acc, setAcc] = useState<string | null>(null);   // open mobile group
  const barRef = useRef<HTMLDivElement>(null);
  const shut = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Two thresholds, not one: a single `scrollY > 30` line flips back and
    // forth on every frame while a scroll gesture settles near 30px (trackpad
    // momentum, a slow drag), and the bar's own `transition:all .55s` on that
    // flip made it visibly grow and shrink in place — read as the header
    // "coming down" mid-scroll rather than settling once. Sticking only
    // releases once scroll has actually returned near the top.
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setStuck((was) => (was ? scrollY > 12 : scrollY > 40));
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => { removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  // Close everything on navigation, and never leave the body scroll-locked.
  useEffect(() => {
    setOpen(false);
    setMenu(null);
  }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Escape closes; a click anywhere outside the bar closes.
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(null); };
    const onDown = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setMenu(null);
    };
    addEventListener("keydown", onKey);
    addEventListener("mousedown", onDown);
    return () => { removeEventListener("keydown", onKey); removeEventListener("mousedown", onDown); };
  }, [menu]);

  // A short delay on leave, so a diagonal mouse path from the label into the
  // panel doesn't slam the menu shut halfway there.
  const hoverIn = useCallback((k: string) => {
    if (shut.current) clearTimeout(shut.current);
    setMenu(k);
  }, []);
  const hoverOut = useCallback(() => {
    if (shut.current) clearTimeout(shut.current);
    shut.current = setTimeout(() => setMenu(null), 160);
  }, []);

  /* Exactly one group may be current.
     `some(item matches)` lit two chips at once the moment two groups shared a
     destination: Care listed /pregnancy, so visiting a pregnancy page
     highlighted Care *and* Pregnancy. Now the longest matching path wins, and
     no group may list another group's hub. */
  const activeKey = (() => {
    let best: string | null = null, len = -1;
    for (const g of MENU) {
      for (const h of [g.href, ...g.items.map((i) => i.href.split("#")[0])]) {
        if (h === "/" || h === "/book") continue;
        if ((pathname === h || pathname.startsWith(h + "/")) && h.length > len) { len = h.length; best = g.key; }
      }
    }
    return best;
  })();
  const inGroup = (g: Group) => activeKey === g.key;

  return (
    <>
      <nav className={`nav${stuck ? " stuck" : ""}${menu ? " menu" : ""}`} id="nav">
        <div className="nav-in" ref={barRef}>
          <Link href="/" className="logo">
            <span className="logo-mk"><svg style={{ color: "#F2C9C4" }}><use href="#i-lotus" /></svg></span>
            <span className="logo-tx">
              <b>Dr Hemangi</b>
              <span>Gynaecology · Fertility · Surgery</span>
            </span>
          </Link>

          <div className="nav-links">
            {MENU.map((g) => (
              <div
                key={g.key}
                className={`nav-grp${menu === g.key ? " on" : ""}`}
                onMouseEnter={() => hoverIn(g.key)}
                onMouseLeave={hoverOut}
                onFocus={() => hoverIn(g.key)}
                onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setMenu(null); }}
              >
                {/* A link, not a button. As a toggle it was unusable: moving the
                    pointer onto it opened the menu, and the click that followed
                    read as "already open" and shut it again. As a link, hover
                    and keyboard focus open the panel and clicking the label
                    goes to that section's hub. */}
                <Link
                  href={g.href}
                  prefetch={false}
                  className={`nav-top${inGroup(g) ? " here" : ""}`}
                  aria-expanded={menu === g.key}
                  aria-haspopup="true"
                  onClick={() => setMenu(null)}
                >
                  {t(g.label)}
                  <svg viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <div className="nav-pop" role="menu" aria-label={g.label}>
                  <div className="nav-pop-in">
                    {g.items.map((i) => (
                      <Link key={i.href + i.label} href={i.href} prefetch={false} role="menuitem" onClick={() => setMenu(null)}>
                        <b>{t(i.label)}</b>
                        {i.desc && <span>{i.desc}</span>}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="nav-cta">
            <Link href="/bookings" className="btn btn-g btn-sm hide-m">{t("My bookings")}</Link>
            <Link href="/book" className="btn btn-p btn-sm">{t("Book consultation")}</Link>
            <button
              className={`burger${open ? " on" : ""}`}
              aria-label={open ? t("Close menu") : t("Open menu")}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span />
            </button>
          </div>
        </div>
      </nav>

      {/* phone / tablet drawer: the same four groups, as accordions */}
      <div className={`mob${open ? " on" : ""}`} id="mob">
        {MENU.map((g, n) => {
          const isOpen = acc === g.key || (acc === null && inGroup(g));
          return (
            <div className={`mob-grp${isOpen ? " on" : ""}`} key={g.key}>
              <button type="button" aria-expanded={isOpen} onClick={() => setAcc(isOpen ? "" : g.key)}>
                <span>{t(g.label)}</span>
                <i>{String(n + 1).padStart(2, "0")}</i>
              </button>
              <div className="mob-sub">
                {g.items.map((i) => (
                  <Link key={i.href + i.label} href={i.href} prefetch={false} tabIndex={isOpen ? undefined : -1}>{t(i.label)}</Link>
                ))}
              </div>
            </div>
          );
        })}
        <div className="mob-foot">
          <Link href="/book" className="btn btn-p btn-block btn-lg">{t("Book a consultation")}</Link>
          <Link href="/contact" className="btn btn-g btn-block">{t("Contact the clinic")}</Link>
        </div>
      </div>
    </>
  );
}

/** Sticky bottom bar on phones. */
export function MobileCta() {
  const pathname = usePathname();
  const [on, setOn] = useState(false);
  useEffect(() => {
    const onScroll = () => setOn(scrollY > 620);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);
  // Don't cover the booking form or the bookings manager with a CTA for the
  // page the visitor is already on.
  if (pathname === "/book" || pathname === "/bookings") return null;
  return (
    <div className={`mcta${on ? " on" : ""}`} id="mcta">
      <Link href="/bookings" className="btn btn-g btn-sm" aria-label="My bookings">
        <svg><use href="#i-cal" /></svg>
      </Link>
      <Link href="/book" className="btn btn-p">Book a consultation</Link>
    </div>
  );
}
