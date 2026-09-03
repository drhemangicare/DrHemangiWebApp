"use client";
import { useCallback, useEffect, useState } from "react";
import { hasRealScans } from "@/lib/site/scans";

/**
 * Which view the fetal illustrations are drawn in — the warm illustration, or
 * the greyscale sonogram.
 *
 * Deliberately not React context. A page carries up to ten illustrations
 * spread across server components (the trimester milestones) and client ones
 * (the journey, the week scrubber); threading a provider through all of them
 * would mean converting server components to client ones for the sake of a
 * toggle. A module-level value plus a DOM event keeps every instance in sync
 * wherever it sits in the tree, and costs one listener each.
 *
 * The choice is remembered, because a patient who prefers the scan view almost
 * certainly prefers it on the next page too.
 */

const KEY = "dh-scan-view";
const EVT = "dh-scan-view-change";

let current = false;
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { current = localStorage.getItem(KEY) === "1"; } catch { /* private mode */ }
}

export function useScanView() {
  /* Always false on the first client render, whatever the stored preference:
     the server rendered the illustration view, so reading localStorage during
     the initial render would produce different markup and React would throw a
     hydration mismatch. The stored value is applied in an effect, one frame
     later, which is invisible to the reader. */
  const [scan, setScan] = useState(false);

  useEffect(() => {
    load();
    if (current) setScan(true);
    const onChange = () => setScan(current);
    addEventListener(EVT, onChange);
    return () => removeEventListener(EVT, onChange);
  }, []);

  const toggle = useCallback((next?: boolean) => {
    current = next === undefined ? !current : next;
    try { localStorage.setItem(KEY, current ? "1" : "0"); } catch { /* private mode */ }
    dispatchEvent(new Event(EVT));
  }, []);

  return { scan, toggle };
}

/**
 * The segmented control. Two real buttons, so it is keyboard and screen-reader
 * usable.
 *
 * Renders NOTHING until the clinic has supplied at least one real scan image.
 * The scan view used to be a drawing of a sonogram and it never passed as one;
 * offering a "Scan view" button that leads to a picture nobody believes is
 * worse than not offering it. See lib/site/scans.ts.
 */
export function ScanToggle({ className }: { className?: string }) {
  const { scan, toggle } = useScanView();
  if (!hasRealScans()) return null;
  return (
    <div className={`svt${className ? " " + className : ""}`} role="group" aria-label="Illustration style">
      <button type="button" className={scan ? "" : "on"} aria-pressed={!scan} onClick={() => toggle(false)}>
        <svg aria-hidden="true"><use href="#i-baby" /></svg>
        Illustration
      </button>
      <button type="button" className={scan ? "on" : ""} aria-pressed={scan} onClick={() => toggle(true)}>
        <svg aria-hidden="true"><use href="#i-scan" /></svg>
        Scan view
      </button>
    </div>
  );
}
