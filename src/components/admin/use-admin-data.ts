"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Fetch-with-cache for the admin screens.
 *
 * Every section was a client component that fetched on mount into empty state,
 * so going Bookings → Patients → Bookings threw the first result away and
 * showed skeletons again for data that had been on screen seconds earlier.
 * That re-fetch-from-blank is most of what "a lot of latency when I click" is:
 * the network time is real, but the blank screen while waiting is what it
 * feels like.
 *
 * Stale-while-revalidate fixes the feel without risking staleness: a cached
 * result paints immediately, a fresh request goes out in the background, and
 * the screen updates when it lands. The doctor sees the last known answer at
 * once and the true one a moment later — instead of nothing, then the truth.
 *
 * A module-level Map, not React state or localStorage. It must outlive the
 * component (that is the whole point), it must NOT outlive the tab — this is
 * patient data and it has no business being written to disk — and a full page
 * load should always start from the server.
 */
const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

export function invalidateAdminCache(prefix?: string) {
  if (!prefix) return cache.clear();
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key);
}

export function useAdminData<T>(url: string | null): {
  data: T | null;
  /** True only when there is nothing to show yet — never during a background refresh. */
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const [data, setData] = useState<T | null>(() => (url ? ((cache.get(url) as T) ?? null) : null));
  const [error, setError] = useState<string | null>(null);
  const [, forceRender] = useState(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = useCallback(
    (force: boolean) => {
      if (!url) return;
      /* Deduplicate: two components mounting against the same URL in the same
         tick should make one request, not two. */
      const existing = inflight.get(url);
      const p =
        !force && existing
          ? existing
          : fetch(url)
              .then(async (r) => {
                const json = await r.json().catch(() => ({}));
                if (!r.ok) throw new Error(json.error || `Request failed (${r.status})`);
                return json;
              })
              .finally(() => inflight.delete(url));
      inflight.set(url, p);

      p.then((json) => {
        cache.set(url, json);
        if (!alive.current) return;
        setData(json as T);
        setError(null);
      }).catch((e: Error) => {
        if (!alive.current) return;
        /* Keep whatever is already on screen. A failed refresh should not
           blank a table the doctor is reading. */
        setError(e.message);
        forceRender((n) => n + 1);
      });
    },
    [url],
  );

  useEffect(() => {
    if (!url) return;
    const cached = cache.get(url) as T | undefined;
    setData(cached ?? null);
    setError(null);
    run(Boolean(cached)); // cached ? revalidate in background : plain fetch
  }, [url, run]);

  return {
    data,
    loading: data === null && error === null,
    error,
    refresh: () => run(true),
  };
}
