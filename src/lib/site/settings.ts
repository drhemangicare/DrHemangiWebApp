import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

/** Cache tag — the admin PATCH busts this so an edit appears immediately. */
export const SETTINGS_TAG = "site-settings";

/**
 * How long a cached copy stays good.
 *
 * Matched to the page `revalidate` in app/(site)/layout.tsx on purpose. Next
 * takes the *lowest* of the two, so a shorter TTL here would silently drag the
 * whole site's regeneration interval down with it — at 300s that was 12 times
 * more background renders than intended, for a clinic address that changes
 * maybe twice a year. The admin PATCH busts the tag, so an actual edit still
 * appears immediately and nobody waits out the hour.
 */
const TTL_SECONDS = 3600;

/**
 * Nothing may block a page render on the database for longer than this.
 *
 * The home page renders four components that each want the settings — the page
 * itself, the About block, the clinic block and the footer — and each one used
 * to open its own query and await it in turn. Against a real Supabase project
 * answering in ~3.5s that is four round trips, serialised, for a page whose
 * content is otherwise entirely static. It showed up in the dev log as
 * `GET / 200 in 14.1s` while every other route answered in under 70ms.
 *
 * The dedupe and cache below fix the normal case. This timeout covers the bad
 * one: a paused free-tier project, a cold start, or a network that is simply
 * gone. The page then renders with sensible defaults instead of hanging — and
 * because a build prerenders these pages, it also stops a sick database from
 * wedging a deploy.
 */
const TIMEOUT_MS = 1500;

function withTimeout<T>(work: Promise<T>, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), TIMEOUT_MS);
    const done = (v: T) => { clearTimeout(timer); resolve(v); };
    work.then(done, () => done(fallback));
  });
}

export type PublicSettings = {
  clinic_address: string | null;
  clinic_timing: string | null;
  clinic_map_link: string | null;
  doctor_photo_url: string | null;
  years_experience: number | null;
  deliveries_count: number | null;
  /** Whether the site offers in-person visits at all. See migration 0005. */
  clinic_visit_enabled: boolean;
  /** Where patients send questions and problem reports. */
  support_email: string;
};

/** Used when the database has not been reached, or the column is blank. */
export const SUPPORT_EMAIL_FALLBACK = "hello@drhemangi.in";

const FALLBACK: PublicSettings = {
  clinic_address: null,
  clinic_timing: null,
  clinic_map_link: null,
  doctor_photo_url: null,
  years_experience: 5,
  deliveries_count: 7000,
  /* Defaults keep the site behaving exactly as it does today if the database
     is unreachable: in-person visits are offered, and the support address is
     the real one rather than an empty mailto. */
  clinic_visit_enabled: true,
  support_email: SUPPORT_EMAIL_FALLBACK,
};

/* Columns that have always existed, and the two added by migration 0005.
   They are requested separately so the site survives being deployed before the
   migration is run: PostgREST rejects the WHOLE select if one column is
   missing, so asking for everything in one go would blank the clinic address
   and timings on the live site until the SQL was applied. The second attempt
   drops the new columns and the defaults cover them. */
const BASE_COLS =
  "clinic_address, clinic_timing, clinic_map_link, doctor_photo_path, years_experience, deliveries_count";
const V5_COLS = "clinic_visit_enabled, support_email";

/** The actual query. Never called directly — go through getPublicSettings(). */
async function readSettings(): Promise<PublicSettings> {
  if (!isSupabaseConfigured()) return FALLBACK;
  try {
    const sb = supabaseAdmin();
    let { data } = await sb
      .from("site_settings")
      .select(`${BASE_COLS}, ${V5_COLS}`)
      .eq("id", 1)
      .maybeSingle();
    if (!data) {
      ({ data } = await sb.from("site_settings").select(BASE_COLS).eq("id", 1).maybeSingle());
    }
    if (!data) return FALLBACK;

    let doctor_photo_url: string | null = null;
    if (data.doctor_photo_path) {
      const { data: pub } = sb.storage.from("site-assets").getPublicUrl(data.doctor_photo_path);
      doctor_photo_url = pub?.publicUrl || null;
    }
    return {
      clinic_address: data.clinic_address ?? null,
      clinic_timing: data.clinic_timing ?? null,
      clinic_map_link: data.clinic_map_link ?? null,
      doctor_photo_url,
      years_experience: data.years_experience ?? FALLBACK.years_experience,
      deliveries_count: data.deliveries_count ?? FALLBACK.deliveries_count,
      /* `?? true` not `|| true`: false is a real, deliberate value here and
         must survive. Migration 0005 may also not have been run yet, in which
         case the column is absent and undefined — offering visits is the safe
         reading of "we do not know". */
      clinic_visit_enabled: (data as Record<string, unknown>).clinic_visit_enabled as boolean ?? true,
      support_email: String((data as Record<string, unknown>).support_email || "").trim() || SUPPORT_EMAIL_FALLBACK,
    };
  } catch {
    return FALLBACK;
  }
}

/** Shared across requests and across pages, until the TTL or the tag says otherwise. */
const readSettingsCached = unstable_cache(readSettings, ["public-settings"], {
  revalidate: TTL_SECONDS,
  tags: [SETTINGS_TAG],
});

/**
 * Server-side read of the public clinic settings, used directly by server
 * components (footer, contact, about) instead of having the browser fetch
 * /api/settings after hydration. Same explicit column allow-list as the API
 * route — `google_refresh_token` lives on this row and must never leave the
 * server.
 *
 * Three layers, and all three matter:
 *   · `cache()`          — React per-request dedupe. Four components asking for
 *                          the settings while rendering one page now produce
 *                          ONE call, not four serialised ones.
 *   · `unstable_cache()` — shared between requests and between pages, so a
 *                          whole build, or five minutes of traffic, costs a
 *                          single query rather than one per page per render.
 *   · `withTimeout()`    — a render never waits more than 1.5s on the database.
 */
export const getPublicSettings = cache(
  (): Promise<PublicSettings> => withTimeout(readSettingsCached(), FALLBACK),
);
