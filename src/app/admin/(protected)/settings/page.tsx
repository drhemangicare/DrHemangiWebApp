import { Suspense } from "react";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isGoogleCalendarConnected } from "@/lib/google-calendar";
import { SettingsForm, type Settings } from "@/components/admin/SettingsForm";

/**
 * The settings screen loads its data on the SERVER.
 *
 * It used to be a client component that fetched `/api/admin/settings` from a
 * `useEffect` after mounting, which meant the doctor watched "Loading…" while
 * the browser did this in order: download the page, download the JS, hydrate,
 * open a request, and only then let the server verify the session (an auth
 * round trip plus a staff lookup) before it even started the query. The
 * navigation felt instant and the content did not, which is exactly what was
 * reported.
 *
 * Fetching here collapses all of that into the same render that produced the
 * page. The form arrives with its values already in it.
 *
 * `requireAdmin` is not called again: the (protected) layout above this has
 * already established the session, and `getAdminUser` is request-cached, so
 * this costs nothing extra.
 */
export const dynamic = "force-dynamic";

async function loadSettings(): Promise<Settings> {
  const sb = supabaseAdmin();
  /* The Google check is an independent network call, so it runs alongside the
     row read rather than after it. */
  const [{ data }, googleConnected] = await Promise.all([
    sb.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    isGoogleCalendarConnected(),
  ]);

  let doctor_photo_url: string | null = null;
  if (data?.doctor_photo_path) {
    const { data: pub } = sb.storage.from("site-assets").getPublicUrl(data.doctor_photo_path);
    /* Same cache-bust as the upload route: the file name never changes, so the
       browser would otherwise show a stale photo after a replacement. */
    doctor_photo_url = pub?.publicUrl ? `${pub.publicUrl}?v=${data.updated_at ?? ""}` : null;
  }

  const row = (data ?? {}) as Record<string, unknown>;
  return {
    clinic_address: (row.clinic_address as string) ?? "",
    clinic_timing: (row.clinic_timing as string) ?? "",
    clinic_map_link: (row.clinic_map_link as string) ?? "",
    doctor_bio: (row.doctor_bio as string) ?? "",
    years_experience: (row.years_experience as number) ?? 5,
    deliveries_count: (row.deliveries_count as number) ?? 7000,
    doctor_photo_url,
    google_connected: googleConnected,
    /* Migration 0005 may not have run yet — see the note in lib/site/settings.ts. */
    clinic_visit_enabled: (row.clinic_visit_enabled as boolean) ?? true,
    support_email: (row.support_email as string) || "hello@drhemangi.in",
  };
}

export default async function AdminSettingsPage() {
  const initial = await loadSettings();
  return (
    // useSearchParams (the ?google=connected callback banner) needs a boundary
    <Suspense fallback={null}>
      <SettingsForm initial={initial} />
    </Suspense>
  );
}
