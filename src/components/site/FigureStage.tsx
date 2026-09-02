"use client";
import { useMemo } from "react";
import { figSVG } from "@/lib/site/figures";

/**
 * The four life-chapter illustrations, all mounted at once and cross-faded
 * between by class (`.on` / `.out`) exactly as the original did — swapping
 * innerHTML instead would restart every gradient and kill the transition.
 *
 * `uid` keeps the SVG gradient ids unique so the hero rig and the journey rig
 * can both be on the page without one stealing the other's fills.
 */
export function FigureStage({ active, uid, className }: { active: number; uid: string; className?: string }) {
  const figures = useMemo(() => [0, 1, 2, 3].map((k) => figSVG(k, uid)), [uid]);
  return (
    <div className={className ?? "figs"}>
      {figures.map((svg, k) => (
        <div
          key={k}
          data-f={k}
          className={`fig-slot${k === active ? " on" : k < active || (active === 0 && k === 3) ? " out" : ""}`}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ))}
    </div>
  );
}
