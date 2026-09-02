import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode } from "@/lib/google-calendar";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/admin-session";
import { consumeOauthState } from "@/lib/oauth-state";
import { env } from "@/lib/env";

// This callback stores the refresh token used to create every patient's
// calendar event and Meet link. It previously had NO authentication and
// ignored the `state` parameter entirely, so anyone could run the consent
// flow against the clinic's public client_id with their OWN Google account
// and have this handler overwrite the clinic's refresh token with theirs —
// silently redirecting every future consultation, along with the patient's
// name, email and reason for visit, onto the attacker's calendar.
//
// Two independent gates now: a live admin session, and a single-use signed
// state value that this server issued for that same admin.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");
  const settingsUrl = new URL("/admin/settings", env.appUrl);

  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.redirect(new URL("/admin/login", env.appUrl));
  }
  if (!state || !(await consumeOauthState(state, admin.id))) {
    settingsUrl.searchParams.set("google", "bad-state");
    return NextResponse.redirect(settingsUrl);
  }

  if (error) {
    settingsUrl.searchParams.set("google", "denied");
    return NextResponse.redirect(settingsUrl);
  }
  if (!code) {
    settingsUrl.searchParams.set("google", "error");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    if (!tokens.refresh_token) {
      // Google only returns a refresh_token on the FIRST consent for an
      // app+account pair. If the doctor is reconnecting, prompt=consent
      // (set in googleAuthUrl) should force a fresh one — but if this
      // still happens, tell them to revoke access at
      // https://myaccount.google.com/permissions and try again.
      settingsUrl.searchParams.set("google", "no-refresh-token");
      return NextResponse.redirect(settingsUrl);
    }

    await supabaseAdmin()
      .from("site_settings")
      .update({
        google_refresh_token: tokens.refresh_token,
        google_connected_email: null, // could be populated via a userinfo call if desired
      })
      .eq("id", 1);

    settingsUrl.searchParams.set("google", "connected");
    return NextResponse.redirect(settingsUrl);
  } catch {
    settingsUrl.searchParams.set("google", "error");
    return NextResponse.redirect(settingsUrl);
  }
}
