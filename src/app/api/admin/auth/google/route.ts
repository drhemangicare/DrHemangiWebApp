import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { googleAuthUrl } from "@/lib/google-calendar";
import { issueOauthState } from "@/lib/oauth-state";
import { jsonError, safeMessage } from "@/lib/http";

// Kicks off the one-time Google OAuth consent so the clinic's calendar can
// be used to auto-create Meet links. Visiting this URL (from a link on
// Admin → Settings) redirects to Google; Google redirects back to
// /api/admin/auth/google/callback.
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  try {
    // Single-use signed nonce, checked by the callback. Passing admin.id
    // directly (as before) was not a CSRF defence: it is not secret and the
    // callback never looked at it.
    const state = await issueOauthState(admin.id);
    const url = googleAuthUrl(state);
    return NextResponse.redirect(url);
  } catch (err) {
    return jsonError(safeMessage(err, "Google isn't configured yet — see SETUP.md"), 500);
  }
}
