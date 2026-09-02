"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLang } from "./Lang";

/**
 * A calendar the site can actually style.
 *
 * `<input type="date">` renders a browser-chrome popup that no stylesheet can
 * touch — on this site it looked like a system dialog dropped onto a hand-made
 * page. This is the same control drawn in our own markup: month grid, keyboard
 * navigation, future dates disabled, and a plain-text read-out for anyone who
 * would rather type.
 *
 * Values are `YYYY-MM-DD` strings in local time. Building them from
 * `toISOString()` would shift the date backwards for anyone east of UTC —
 * i.e. every patient this clinic has.
 */

const WD = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function DateField({
  value, onChange, label, hint, maxToday = true, monthsBack = 11,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  hint?: React.ReactNode;
  maxToday?: boolean;
  monthsBack?: number;
}) {
  const id = useId();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [today, setToday] = useState<Date | null>(null);
  const [view, setView] = useState<Date | null>(null);   // first of the shown month
  const [focus, setFocus] = useState<string>("");        // iso of the day holding focus
  const wrap = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);

  // `new Date()` on the server and on the client disagree, so the calendar is
  // built after mount. The field itself renders identically either way.
  useEffect(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    setToday(t);
    const v = parse(value);
    setView(new Date((v ?? t).getFullYear(), (v ?? t).getMonth(), 1));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); } };
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    addEventListener("keydown", onKey);
    addEventListener("mousedown", onDown);
    return () => { removeEventListener("keydown", onKey); removeEventListener("mousedown", onDown); };
  }, [open]);

  // move focus onto the grid when it opens, so arrow keys work immediately
  useEffect(() => {
    if (!open || !grid.current) return;
    const el = grid.current.querySelector<HTMLButtonElement>("button[data-on], button[data-today], button:not(:disabled)");
    el?.focus();
  }, [open]);

  const days = useMemo(() => {
    if (!view) return [];
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7;                       // weeks start Monday
    const count = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const out: (Date | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= count; d++) out.push(new Date(view.getFullYear(), view.getMonth(), d));
    while (out.length % 7) out.push(null);
    return out;
  }, [view]);

  const selected = parse(value);
  const minDate = today ? new Date(today.getFullYear(), today.getMonth() - monthsBack, 1) : null;
  const disabled = (d: Date) =>
    (maxToday && today ? d > today : false) || (minDate ? d < minDate : false);

  const shift = (isoStr: string, by: number) => {
    const d = parse(isoStr);
    if (!d) return;
    d.setDate(d.getDate() + by);
    if (disabled(d)) return;
    setFocus(iso(d));
    setView(new Date(d.getFullYear(), d.getMonth(), 1));
    requestAnimationFrame(() => {
      grid.current?.querySelector<HTMLButtonElement>(`button[data-d="${iso(d)}"]`)?.focus();
    });
  };

  const pretty = selected
    ? `${selected.getDate()} ${MONTHS[selected.getMonth()]} ${selected.getFullYear()}`
    : t("Choose a date");

  return (
    <div className="df" ref={wrap}>
      <label className="df-label" htmlFor={`${id}-btn`}>{label}</label>

      <button
        type="button" id={`${id}-btn`} className={`df-btn${selected ? " has" : ""}`}
        aria-haspopup="dialog" aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg aria-hidden="true"><use href="#i-cal" /></svg>
        <span>{pretty}</span>
        <i aria-hidden="true" />
      </button>

      {open && view && (
        <div className="df-pop" role="dialog" aria-label={label}>
          <div className="df-head">
            <button type="button" aria-label={t("Previous month")}
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
              disabled={!!minDate && new Date(view.getFullYear(), view.getMonth(), 1) <= minDate}>
              <svg viewBox="0 0 16 16"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <b>{MONTHS[view.getMonth()]} {view.getFullYear()}</b>
            <button type="button" aria-label={t("Next month")}
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
              disabled={!!today && maxToday && view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth()}>
              <svg viewBox="0 0 16 16"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>

          <div className="df-wd" aria-hidden="true">
            {WD.map((d, i) => <span key={i}>{d}</span>)}
          </div>

          <div
            className="df-grid" ref={grid}
            onKeyDown={(e) => {
              const cur = focus || value || (today ? iso(today) : "");
              const by = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1
                : e.key === "ArrowUp" ? -7 : e.key === "ArrowDown" ? 7 : 0;
              if (by) { e.preventDefault(); shift(cur, by); }
            }}
          >
            {days.map((d, i) =>
              d === null ? <span key={`e${i}`} /> : (
                <button
                  key={iso(d)} type="button" data-d={iso(d)}
                  data-on={selected && sameDay(d, selected) ? "" : undefined}
                  data-today={today && sameDay(d, today) ? "" : undefined}
                  disabled={disabled(d)}
                  aria-current={selected && sameDay(d, selected) ? "date" : undefined}
                  onClick={() => { onChange(iso(d)); setFocus(iso(d)); setOpen(false); }}
                >
                  {d.getDate()}
                </button>
              ))}
          </div>

          <div className="df-foot">
            {today && (
              <button type="button" onClick={() => { onChange(iso(today)); setOpen(false); }}>{t("Today")}</button>
            )}
            {value && (
              <button type="button" onClick={() => { onChange(""); setOpen(false); }}>{t("Clear")}</button>
            )}
          </div>
        </div>
      )}

      {hint && <p className="df-hint">{hint}</p>}
    </div>
  );
}
