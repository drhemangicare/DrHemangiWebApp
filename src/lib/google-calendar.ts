import { google } from "googleapis";
import { requireEnv, env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/server";

// One-time OAuth (done from /admin/settings) lets the app create Google
// Calendar events with an auto-generated Meet link on the doctor's own
// calendar. We store only the long-lived refresh token in site_settings and
// mint short-lived access tokens from it on demand — no separate token
// service needed, and it costs nothing beyond a normal Google account.

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

export function googleOAuthClient() {
  return new google.auth.OAuth2(
    requireEnv("googleClientId"),
    requireEnv("googleClientSecret"),
    requireEnv("googleRedirectUri")
  );
}

export function googleAuthUrl(state: string): string {
  const client = googleOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // forces a refresh_token to be returned even on repeat connects
    scope: SCOPES,
    state,
  });
}

export async function exchangeGoogleCode(code: string) {
  const client = googleOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens; // includes refresh_token (only on first consent) + access_token
}

async function getAuthorizedClient() {
  const { data: settings } = await supabaseAdmin()
    .from("site_settings")
    .select("google_refresh_token")
    .eq("id", 1)
    .maybeSingle();
  if (!settings?.google_refresh_token) {
    throw new Error("Google Calendar isn't connected yet. Connect it from Admin → Settings.");
  }
  const client = googleOAuthClient();
  client.setCredentials({ refresh_token: settings.google_refresh_token });
  return client;
}

export async function isGoogleCalendarConnected(): Promise<boolean> {
  const { data } = await supabaseAdmin()
    .from("site_settings")
    .select("google_refresh_token")
    .eq("id", 1)
    .maybeSingle();
  return Boolean(data?.google_refresh_token);
}

/** Creates a calendar event with a Google Meet link for a confirmed booking.
 *  Returns { eventId, meetLink } or null if Google isn't connected (booking
 *  still succeeds — the clinic just won't have an auto-generated Meet link
 *  until they connect their calendar). */
export async function createConsultEvent(opts: {
  patientName: string;
  patientEmail: string;
  categoryName: string;
  startIso: string;
  endIso: string;
  referenceCode: string;
  notes?: string;
}): Promise<{ eventId: string; meetLink: string | null } | null> {
  try {
    const auth = await getAuthorizedClient();
    const calendar = google.calendar({ version: "v3", auth });
    const res = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      sendUpdates: "none", // we send our own branded email via Brevo instead
      requestBody: {
        summary: `${opts.categoryName} — ${opts.patientName}`,
        description: `Booking reference: ${opts.referenceCode}\n${opts.notes || ""}`,
        start: { dateTime: opts.startIso, timeZone: env.timezone },
        end: { dateTime: opts.endIso, timeZone: env.timezone },
        attendees: [{ email: opts.patientEmail, displayName: opts.patientName }],
        conferenceData: {
          createRequest: {
            requestId: opts.referenceCode + "-" + Date.now(),
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });
    const meetLink = res.data.hangoutLink || null;
    return { eventId: res.data.id!, meetLink };
  } catch (err) {
    console.error("Google Calendar event creation failed:", err);
    return null;
  }
}

export async function updateConsultEvent(opts: {
  eventId: string;
  startIso: string;
  endIso: string;
}): Promise<{ meetLink: string | null } | null> {
  try {
    const auth = await getAuthorizedClient();
    const calendar = google.calendar({ version: "v3", auth });
    const res = await calendar.events.patch({
      calendarId: "primary",
      eventId: opts.eventId,
      sendUpdates: "none",
      requestBody: {
        start: { dateTime: opts.startIso, timeZone: env.timezone },
        end: { dateTime: opts.endIso, timeZone: env.timezone },
      },
    });
    return { meetLink: res.data.hangoutLink || null };
  } catch (err) {
    console.error("Google Calendar event update failed:", err);
    return null;
  }
}

export async function cancelConsultEvent(eventId: string): Promise<void> {
  try {
    const auth = await getAuthorizedClient();
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({ calendarId: "primary", eventId, sendUpdates: "none" });
  } catch (err) {
    console.error("Google Calendar event deletion failed:", err);
  }
}
