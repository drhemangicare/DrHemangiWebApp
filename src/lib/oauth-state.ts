import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireEnv } from "@/lib/env";

/**
 * Single-use, signed, expiring `state` for the Google OAuth consent round
 * trip. Bound to the admin who started it, so a code obtained by consenting
 * with a different Google account cannot be replayed against this callback.
 *
 * Persisted rather than held in memory: the consent redirect can land on a
 * different serverless instance than the one that issued it.
 */
const TTL_MS = 10 * 60 * 1000;

export async function issueOauthState(adminId: string): Promise<string> {
  const nonce = crypto.randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();
  const sb = supabaseAdmin();
  await sb.from("oauth_states").insert({ nonce: hash(nonce), admin_id: adminId, expires_at: expiresAt });
  return nonce;
}

export async function consumeOauthState(nonce: string, adminId: string): Promise<boolean> {
  if (!nonce || nonce.length > 200) return false;
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("oauth_states")
    .select("id, admin_id, expires_at")
    .eq("nonce", hash(nonce))
    .maybeSingle();
  if (!data) return false;
  // Delete first so a replay of the same value can never succeed twice, even
  // if two requests race.
  await sb.from("oauth_states").delete().eq("id", data.id);
  if (data.admin_id !== adminId) return false;
  if (new Date(data.expires_at).getTime() < Date.now()) return false;
  return true;
}

function hash(nonce: string): string {
  return crypto.createHmac("sha256", requireEnv("lookupTokenSecret")).update(nonce).digest("hex");
}
