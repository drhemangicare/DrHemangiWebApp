"use client";
import { useMemo, useState } from "react";
import { MAX_WEEK, WEEKS, trimesterOf, weekData } from "@/lib/site/pregnancy";
import { FetalStageArt } from "./FetalStage";
import { DateField } from "./DateField";
import { InfoNote } from "./InfoNote";
import { ScanToggle } from "./ScanView";
import { useLang } from "./Lang";

/**
 * The week-by-week detail, as one interactive panel instead of forty pages.
 *
 * Drag the scrubber and the illustration grows with it. The date field is the
 * part patients actually need: almost nobody knows what week they are in, but
 * everybody knows when their last period started — which is exactly how a
 * doctor dates a pregnancy anyway.
 */

const DAY = 86400000;

function fmt(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export function WeekExplorer({ from = 1, to = MAX_WEEK }: { from?: number; to?: number }) {
  const [w, setW] = useState(Math.min(to, Math.max(from, 12)));
  const [lmp, setLmp] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const { t } = useLang();

  const d = weekData(w)!;
  const marks = useMemo(() => WEEKS.filter((x) => x.w >= from && x.w <= to && x.w % 4 === 0), [from, to]);

  function onDate(v: string) {
    setLmp(v);
    if (!v) { setMsg(null); return; }
    const start = new Date(v + "T00:00:00");
    if (Number.isNaN(start.getTime())) { setMsg(null); return; }
    const days = Math.floor((Date.now() - start.getTime()) / DAY);
    if (days < 0) { setMsg("That date is in the future — check the day you entered."); return; }
    const wk = Math.floor(days / 7) + 1;
    const due = new Date(start.getTime() + 280 * DAY);
    if (wk > MAX_WEEK) {
      setMsg(`That is more than 40 weeks ago. Estimated due date was ${fmt(due)}.`);
      setW(to);
      return;
    }
    setW(Math.min(to, Math.max(from, wk)));
    setMsg(`Around week ${wk}. Estimated due date ${fmt(due)} — an estimate, not a deadline.`);
  }

  return (
    <div className="wx">
      <div className="wx-top">
        <div>
          <span className="eyebrow">{t("Find your week")}</span>
          <h3 style={{ margin: "12px 0 8px" }}>{t("Week")} {w}</h3>
          <p className="wx-size">{t(d.size)}</p>
        </div>
        <div className="wx-date">
          <DateField
            value={lmp}
            onChange={onDate}
            label={t("Not sure which week you are in?")}
            hint={
              <span className={msg ? "on" : undefined}>
                {msg ?? "Pick the first day of your last period and we will work out the week and your due date."}
              </span>
            }
          />
        </div>
      </div>

      <div className="wx-slide">
        <input
          type="range" min={from} max={to} value={w} step={1}
          onChange={(e) => setW(Number(e.target.value))}
          aria-label="Week of pregnancy"
          aria-valuetext={`${t("Week")} ${w}, ${t(d.size)}`}
        />
        <div className="wx-marks" aria-hidden="true">
          {marks.map((m) => (
            <button key={m.w} type="button" className={m.w === w ? "on" : ""} onClick={() => setW(m.w)}>
              {m.w}
            </button>
          ))}
        </div>
      </div>

      <div className="wx-body">
        <div className="wx-art">
          <ScanToggle className="wx-toggle" />
          <FetalStageArt week={w} uid="wx" cap={false} />
          <div className="wk-stats">
            <div className="wk-stat"><b>{d.len}</b><span>{t("Length")}</span></div>
            <div className="wk-stat"><b>{d.wt}</b><span>{t("Weight")}</span></div>
            <div className="wk-stat"><b>T{trimesterOf(w)}</b><span>{t("Trimester")}</span></div>
          </div>
        </div>
        <div className="wx-cards">
          <div className="wk-card">
            <em><svg><use href="#i-baby" /></svg>{t("Your baby")}</em>
            <p>{t(d.baby)}</p>
          </div>
          <div className="wk-card">
            <em><svg><use href="#i-heart" /></svg>{t("You this week")}</em>
            <p>{t(d.you)}</p>
          </div>
          <div className="wk-card">
            <em><svg><use href="#i-cal" /></svg>{t("Care & checks")}</em>
            <p>{t(d.care)}</p>
          </div>
        </div>
      </div>
      <InfoNote kind="size" />
    </div>
  );
}
