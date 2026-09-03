import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { careFrom, careCopy, type Care, type CareCopy } from "./care";

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
 * gone. The page then renders with sensible defaults instead of hanging.
 *
 * ── WHY 8s AND NOT 1.5s ───────────────────────────────────────────────────
 * It was 1500ms, and that was a bug that hid the doctor's photo.
 *
 * The note above records this very project answering in ~3.5s. A 1.5s deadline
 * therefore did not protect against a broken database — it threw away *correct
 * answers that were on their way*, on every cold render, and the page fell
 * back to `doctor_photo_url: null`, which renders the placeholder silhouette.
 * The clinic address and timings went with it. Nothing errored and nothing was
 * logged, so it read as "the photo just disappeared".
 *
 * A timeout must be slower than the thing it is guarding, or it is not a
 * guard, it is a race. 8s is comfortably past a cold Supabase start and still
 * well inside any sane request budget.
 */
const TIMEOUT_MS = 8000;

/**
 * During `next build` there is no timeout at all.
 *
 * These pages are prerendered and then served from the CDN for an hour. A
 * timeout that trips during the build does not cost one slow render — it bakes
 * the fallback into static HTML that every visitor gets for the next hour.
 * Waiting a few extra seconds once, at build time, is strictly better than
 * publishing a page with the placeholder on it.
 */
const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";

function withTimeout<T>(work: Promise<T>, fallback: T): Promise<T> {
  if (IS_BUILD) return work.catch(() => fallback);
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
  /** Whether in-person clinic visits are offered at all. See migration 0005. */
  clinic_visit_enabled: boolean;
  /** Where patients send questions and problem reports. */
  support_email: string;
  /** Printed under every prescription. See migration 0006. */
  doctor_registration_no: string | null;
  doctor_qualifications: string | null;
  /** Whether video consultations are offered — and therefore bookable. See migration 0007. */
  online_consultation_enabled: boolean;
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
  doctor_registration_no: null,
  doctor_qualifications: null,
  /* TRUE when the database cannot be read: a clinic that has switched booking
     ON must not silently lose it because of one bad query. The opposite
     failure — briefly showing booking on a site that meant to hide it — is
     recoverable and far less damaging than a booking page that vanishes.
     Note this is the SERVER fallback and is deliberately the opposite of
     CARE_CLOSED, the client-side default; the reasoning is in care.ts. */
  online_consultation_enabled: true,
};

/* Columns that have always existed, and the two added by migration 0005.
   They are requested separately so the site survives being deployed before the
   migration is run: PostgREST rejects the WHOLE select if one column is
   missing, so asking for everything in one go would blank the clinic address
   and timings on the live site until the SQL was applied. The second attempt
   drops the new columns and the defaults cover them. */
const BASE_COLS =
  "clinic_address, clinic_timing, clinic_map_link, doctor_photo_path, years_experience, deliveries_count";
/* Columns added by later migrations, requested as one group. If ANY of them is
   missing the whole select fails and the second attempt drops all of them —
   the defaults below then cover every one, so the site degrades to sensible
   values rather than to a blank page. 0005 added the first two, 0006 the
   registration details that print on a prescription. */
const V5_COLS =
  "clinic_visit_enabled, support_email, doctor_registration_no, doctor_qualifications, online_consultation_enabled";

/**
 * The actual query. Never called directly — go through getPublicSettings().
 *
 * ── THIS FUNCTION THROWS ON FAILURE, AND THAT IS DELIBERATE ───────────────
 * It used to wrap everything in try/catch and `return FALLBACK`. That looks
 * defensive and is in fact the opposite, because of where it sits: the return
 * value goes straight into `unstable_cache` below, with a one-hour TTL. So a
 * single transient network blip — one cold start, one dropped connection —
 * did not degrade one render. It wrote "there is no photo, there is no clinic
 * address" into the cache and served that to everybody for the next hour.
 *
 * Measured, not assumed: a probe that threw on its first call and returned
 * data on its second showed the throw was NOT persisted (the next call re-ran
 * the function and cached the good value), while a returned value WAS. So
 * throwing is what keeps a failure from being remembered. `withTimeout` above
 * catches it and hands the caller the fallback for that one render only.
 *
 * A genuinely absent row is different — that is a real answer, not a failure,
 * and it is allowed to cache.
 */
async function readSettings(): Promise<PublicSettings> {
  if (!isSupabaseConfigured()) return FALLBACK;
  const sb = supabaseAdmin();
  let { data, error } = await sb
    .from("site_settings")
    .select(`${BASE_COLS}, ${V5_COLS}`)
    .eq("id", 1)
    .maybeSingle();

  /* The likeliest reason the first select fails is that migration 0005 has not
     been run, so the two new columns do not exist yet and PostgREST rejects
     the whole statement. Retry without them; the defaults cover them. */
  if (error) {
    ({ data, error } = await sb.from("site_settings").select(BASE_COLS).eq("id", 1).maybeSingle());
  }
  /* Still failing means the database is unreachable or misconfigured, which is
     NOT an answer and must not be cached as one. */
  if (error) {
    throw new Error(`site_settings unreadable: ${error.message ?? String(error)}`);
  }
  if (!data) return FALLBACK;

  {
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
      doctor_registration_no:
        String((data as Record<string, unknown>).doctor_registration_no || "").trim() || null,
      doctor_qualifications:
        String((data as Record<string, unknown>).doctor_qualifications || "").trim() || null,
      /* `?? true`, not `|| true`: false is a deliberate choice and must survive. */
      online_consultation_enabled:
        ((data as Record<string, unknown>).online_consultation_enabled as boolean) ?? true,
    };
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

/**
 * The two consultation switches, resolved into one value with its copy.
 *
 * Server components should reach for this rather than reading the two booleans
 * apart, because almost nothing depends on one flag alone — "is there a Book
 * button" is `care.booking`, but "does this page get to promise a 40-minute
 * appointment" depends on both. Every mode-dependent sentence lives in
 * CARE_COPY, so a call site picks a field instead of writing a ternary.
 *
 * `settings` is returned alongside so a caller that also needs the address or
 * the photo does not make a second (deduped, but still noisy) call.
 */
export const getCare = cache(
  async (): Promise<{ care: Care; copy: CareCopy; settings: PublicSettings }> => {
    const settings = await getPublicSettings();
    const care = careFrom(settings.online_consultation_enabled, settings.clinic_visit_enabled);
    return { care, copy: careCopy(care, settings.support_email), settings };
  },
);
