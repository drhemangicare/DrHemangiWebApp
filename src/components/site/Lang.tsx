"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, LOCALES, isLocale, translate, type Locale } from "@/lib/i18n/dict";

/**
 * Language, without moving every page under a /[lang] route.
 *
 * The pages are statically generated in English — which is what search engines
 * index and what a first paint shows. The chosen language lives in a cookie and
 * is applied on the client, so switching is instant, works on a static export,
 * and needs no server round trip. `<html lang>` is updated too, so screen
 * readers and Chrome's own translate prompt behave.
 *
 * The trade-off, stated plainly: translated pages are not separately indexable.
 * If that matters later, the fix is /[lang] routes and this provider stays as
 * the client half of it.
 */

const KEY = "dh.lang";
const Ctx = createContext<{ locale: Locale; setLocale: (l: Locale) => void; t: (s: string) => string }>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (s) => s,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLoc] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const saved = typeof document !== "undefined"
      ? document.cookie.split("; ").find((c) => c.startsWith(KEY + "="))?.split("=")[1]
      : null;
    if (saved && isLocale(saved)) setLoc(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLoc(l);
    // a year, path-wide, lax — it is a display preference, nothing more
    document.cookie = `${KEY}=${l};path=/;max-age=31536000;samesite=lax`;
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, t: (s: string) => translate(locale, s) }),
    [locale, setLocale],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);

/** Translate a literal string. The English text is the key. */
export function T({ children }: { children: string }) {
  const { t } = useLang();
  return <>{t(children)}</>;
}

/** Shown where long clinical prose has not been translated yet. */
export function UntranslatedNote() {
  const { locale, t } = useLang();
  if (locale === DEFAULT_LOCALE) return null;
  return (
    <p className="lang-note">
      <svg aria-hidden="true"><use href="#i-note" /></svg>
      {t("Detailed medical text is shown in English until Dr Hemangi has approved the translation.")}
    </p>
  );
}

export function LangPicker({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLang();
  const [open, setOpen] = useState(false);
  const current = LOCALES.find((l) => l.code === locale)!;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".lang")) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("mousedown", onDown);
    addEventListener("keydown", onKey);
    return () => { removeEventListener("mousedown", onDown); removeEventListener("keydown", onKey); };
  }, [open]);

  if (compact) {
    return (
      <div className="lang-row" role="group" aria-label={t("Language")}>
        {LOCALES.map((l) => (
          <button
            key={l.code} type="button"
            className={l.code === locale ? "on" : ""}
            aria-pressed={l.code === locale}
            onClick={() => setLocale(l.code)}
          >
            {l.native}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`lang${open ? " on" : ""}`}>
      <button type="button" className="lang-btn" aria-haspopup="listbox" aria-expanded={open}
        aria-label={t("Language")} onClick={() => setOpen((v) => !v)}>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="7.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M2.4 10h15.2M10 2.4c4 4.2 4 11.2 0 15.2-4-4-4-11 0-15.2z" fill="none"
            stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span>{current.code.toUpperCase()}</span>
      </button>
      <div className="lang-pop" role="listbox" aria-label={t("Language")}>
        {LOCALES.map((l) => (
          <button
            key={l.code} type="button" role="option" aria-selected={l.code === locale}
            className={l.code === locale ? "on" : ""}
            onClick={() => { setLocale(l.code); setOpen(false); }}
          >
            <b>{l.native}</b>
            <span>{l.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
