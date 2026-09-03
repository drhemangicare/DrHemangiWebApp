import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/require-admin";
import { jsonError, safeMessage } from "@/lib/http";

/**
 * The patient list — derived, not stored.
 *
 * There is no `patients` table and this deliberately does not add one. The
 * booking flow has no login: the site tells patients "your email is your
 * account", and `/bookings` looks people up by exactly that. So the email
 * already IS the patient identity, and every consultation already carries it.
 *
 * Introducing a patients table would mean back-filling it from bookings,
 * keeping it in step on every new booking, and deciding what happens when
 * somebody books again with a different spelling of their name — three new
 * ways to be wrong about who a patient is, to store facts the bookings table
 * already holds. Grouping on read has none of those problems and cannot drift.
 *
 * Matching is on lower-cased email. Phone is shown but not used as a key: two
 * family members sharing one phone number is common and must not merge into
 * one patient record, whereas a shared email effectively is one account.
 */
type Row = {
  id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  patient_age: number | null;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  categories?: { name: string } | null;
};

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;

  const q = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 80);

  let query = supabaseAdmin()
    .from("bookings")
    .select("id, patient_name, patient_email, patient_phone, patient_age, scheduled_date, scheduled_time, status, categories(name)")
    .order("scheduled_date", { ascending: false })
    .limit(2000);

  if (q) {
    /* Same PostgREST-injection guard as the bookings search: these characters
       are grammar in the filter syntax, not text. */
    const safeQ = q.replace(/[,()".*\\]/g, " ").trim();
    if (safeQ) {
      query = query.or(
        `patient_name.ilike.%${safeQ}%,patient_email.ilike.%${safeQ}%,patient_phone.ilike.%${safeQ}%`,
      );
    }
  }

  const { data, error } = await query;
  if (error) return jsonError(safeMessage(error), 500);

  const today = new Date().toISOString().slice(0, 10);
  const byEmail = new Map<
    string,
    {
      email: string;
      name: string;
      phone: string;
      age: number | null;
      visits: number;
      completed: number;
      cancelled: number;
      lastVisit: string | null;
      nextVisit: string | null;
      lastService: string | null;
    }
  >();

  for (const b of (data || []) as unknown as Row[]) {
    const key = (b.patient_email || "").toLowerCase();
    if (!key) continue;
    const cur = byEmail.get(key) ?? {
      email: b.patient_email,
      name: b.patient_name,
      phone: b.patient_phone,
      age: b.patient_age,
      visits: 0,
      completed: 0,
      cancelled: 0,
      lastVisit: null as string | null,
      nextVisit: null as string | null,
      lastService: null as string | null,
    };

    cur.visits += 1;
    if (b.status === "completed") cur.completed += 1;
    if (b.status === "cancelled") cur.cancelled += 1;

    /* The most recent PAST appointment, and the soonest FUTURE one. Cancelled
       bookings count as history but never as "next visit". */
    if (b.scheduled_date <= today) {
      if (!cur.lastVisit || b.scheduled_date > cur.lastVisit) {
        cur.lastVisit = b.scheduled_date;
        cur.lastService = b.categories?.name ?? null;
      }
    } else if (b.status !== "cancelled") {
      if (!cur.nextVisit || b.scheduled_date < cur.nextVisit) cur.nextVisit = b.scheduled_date;
    }

    /* Keep the newest spelling of the name and the newest phone — rows arrive
       newest-first, so the first one seen for a patient is the freshest. */
    if (cur.visits === 1) {
      cur.name = b.patient_name;
      cur.phone = b.patient_phone;
      cur.age = b.patient_age;
    }
    byEmail.set(key, cur);
  }

  const patients = [...byEmail.values()].sort((a, b) => {
    /* Anyone with an upcoming appointment first (soonest first), then everyone
       else by how recently they were seen. That is the order a clinic actually
       works in. */
    if (a.nextVisit && b.nextVisit) return a.nextVisit < b.nextVisit ? -1 : 1;
    if (a.nextVisit) return -1;
    if (b.nextVisit) return 1;
    return (b.lastVisit || "").localeCompare(a.lastVisit || "");
  });

  return NextResponse.json({ patients });
}
