import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function safeMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof Error) return err.message;
  /* Supabase does not throw. `PostgrestError` and `StorageError` are plain
     objects carrying `message` (and often `details` / `hint`), so the
     `instanceof Error` check above missed every database failure in the app
     and the admin was shown the bare fallback — "Something went wrong" — for
     errors that had already said exactly what was wrong and how to fix it. */
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    const parts = [e.message, e.details, e.hint, e.error_description]
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0);
    if (parts.length) return parts.join(" — ");
  }
  return fallback;
}
