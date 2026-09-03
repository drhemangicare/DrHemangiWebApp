"use client";
import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";

export type Settings = {
  clinic_address: string;
  clinic_timing: string;
  clinic_map_link: string;
  doctor_bio: string;
  years_experience: number;
  deliveries_count: number;
  doctor_photo_url: string | null;
  google_connected: boolean;
  clinic_visit_enabled: boolean;
  support_email: string;
  doctor_registration_no: string;
  doctor_qualifications: string;
  online_consultation_enabled: boolean;
};

export function SettingsForm({ initial }: { initial: Settings }) {
  const [settings, setSettings] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  /* Every write on this page used to discard its response, so a rejected save
     was indistinguishable from a successful one — the button said "Saving…",
     went back to normal, and the value quietly reverted on the next reload.
     Nothing is allowed to fail silently here now. */
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const googleStatus = searchParams.get("google");

  /* "The photo is not showing" was diagnosed three times by reasoning about
     the code and was wrong each time. This asks the server to walk the path
     the photo actually takes and report the first broken step. */
  type Step = { step: string; ok: boolean; detail: string };
  const [diag, setDiag] = useState<Step[] | null>(null);
  const [diagBusy, setDiagBusy] = useState(false);

  async function diagnose() {
    setDiagBusy(true);
    setDiag(null);
    try {
      const res = await fetch("/api/admin/settings/photo/diagnose");
      const data = await res.json().catch(() => ({}));
      setDiag(
        Array.isArray(data.steps) && data.steps.length
          ? data.steps
          : [{ step: "Check failed", ok: false, detail: data.error || `HTTP ${res.status}` }],
      );
    } catch {
      setDiag([{ step: "Check failed", ok: false, detail: "Could not reach the server." }]);
    } finally {
      setDiagBusy(false);
    }
  }


  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_address: settings.clinic_address,
          clinic_timing: settings.clinic_timing,
          clinic_map_link: settings.clinic_map_link,
          doctor_bio: settings.doctor_bio,
          years_experience: settings.years_experience,
          deliveries_count: settings.deliveries_count,
          clinic_visit_enabled: settings.clinic_visit_enabled,
          support_email: (settings.support_email || "").trim(),
          doctor_registration_no: (settings.doctor_registration_no || "").trim(),
          doctor_qualifications: (settings.doctor_qualifications || "").trim(),
          online_consultation_enabled: settings.online_consultation_enabled,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ kind: "err", text: data.error || `Could not save (${res.status}).` });
      } else {
        /* Show what the database actually stored, not what was typed. If a
           value was rejected or normalised, the form should reflect the truth. */
        if (data.settings) {
          setSettings((cur) => ({ ...cur, ...data.settings }));
        }
        setMsg({ kind: "ok", text: "Saved. The website is updated." });
      }
    } catch {
      setMsg({ kind: "err", text: "Could not reach the server. Check your connection and try again." });
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/settings/photo", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ kind: "err", text: data.error || `Upload failed (${res.status}).` });
        return;
      }
      setSettings((s) => ({ ...s, doctor_photo_url: data.doctor_photo_url }));
      setMsg({ kind: "ok", text: "Photo uploaded. It is live on the website now." });
    } catch {
      setMsg({ kind: "err", text: "Could not reach the server while uploading." });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-plum-deep">Settings</h1>
        <p className="text-sm text-muted mt-1">Clinic details, doctor photo, and integrations.</p>
      </div>

      {googleStatus && (
        <div
          className={`text-sm rounded-xl px-4 py-3 ${
            googleStatus === "connected" ? "bg-ok/10 text-ok" : "bg-warn/10 text-warn"
          }`}
        >
          {googleStatus === "connected" && "Google Calendar connected — new bookings will get an automatic Meet link."}
          {googleStatus === "denied" && "Google sign-in was cancelled."}
          {googleStatus === "no-refresh-token" && "Google didn't return a refresh token — revoke access at myaccount.google.com/permissions and try connecting again."}
          {googleStatus === "error" && "Something went wrong connecting Google Calendar."}
        </div>
      )}

      {/* First on the page because it changes what the whole public site does. */}
      <section className="a-card rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="font-serif text-lg text-plum-deep">Online consultation</h2>
        <label className="flex items-start gap-3 rounded-xl border border-black/5 bg-blush-soft/40 p-3.5 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-plum shrink-0"
            checked={settings.online_consultation_enabled}
            onChange={(e) => setSettings({ ...settings, online_consultation_enabled: e.target.checked })}
          />
          <span>
            <span className="block text-sm font-semibold text-plum-deep">
              Let patients book consultations online
            </span>
            <span className="block text-xs text-muted mt-1">
              Turn this off to run the site as a professional website only. Every booking button disappears, the
              booking and &ldquo;my bookings&rdquo; pages stop existing, and the closing section of each page invites
              people to contact the clinic instead. Everything else on the site works exactly as it does now.
            </span>
          </span>
        </label>
        {!settings.online_consultation_enabled && (
          <p className="text-xs text-warn bg-warn/10 rounded-xl px-3.5 py-2.5">
            Online booking is currently switched <b>off</b> for visitors. Nothing has been deleted — existing
            bookings, prices, discounts and availability are all still here and still editable, and turning this back
            on restores the booking flow immediately.
          </p>
        )}
        {/* The two switches are read together by the public site, so the state
            that matters is the combination — and "both off" is the one an
            admin is most likely to reach without meaning to. */}
        {!settings.online_consultation_enabled && !settings.clinic_visit_enabled && (
          <p className="text-xs text-plum-deep bg-blush-soft/70 rounded-xl px-3.5 py-2.5">
            Both this and <b>in-person visits</b> are off, so the public site is not offering consultations at all.
            It now reads as a women&apos;s-health resource with the clinic&apos;s phone number and inbox: the
            condition guides, pregnancy journey, services and doctor profile are all still there, and every
            appointment promise — booking buttons, &ldquo;25–40 minute consultations&rdquo;, the video-consult FAQ —
            has been replaced rather than left dangling. Switch either one back on to restore that half of the site.
          </p>
        )}
      </section>

      <section className="a-card rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="font-serif text-lg text-plum-deep">Doctor&apos;s photo</h2>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-blush-soft overflow-hidden grid place-items-center shrink-0">
            {settings.doctor_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.doctor_photo_url} alt="Dr Hemangi" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-plum-mid text-center px-2">No photo yet</span>
            )}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-plum text-white text-xs font-semibold hover:bg-plum-deep disabled:opacity-50"
            >
              {uploading && <span className="spin-sm" aria-hidden />}
              {uploading ? "Uploading…" : "Upload photo"}
            </button>
            <p className="text-xs text-muted mt-1.5">Square-ish photo, at least 600×600px works best. Replaces the placeholder illustration on the homepage automatically.</p>
          </div>
        </div>

        {/* Diagnosis, not guesswork. */}
        <div className="pt-1 border-t border-black/5">
          <button
            onClick={diagnose}
            disabled={diagBusy}
            className="text-xs font-semibold text-plum underline underline-offset-4 decoration-plum/30 hover:decoration-plum disabled:opacity-50 press"
          >
            {diagBusy ? "Checking…" : "Photo not showing on the website? Run a check"}
          </button>

          {diag && (
            <ul className="mt-3 space-y-2">
              {diag.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-xs leading-relaxed">
                  <span
                    aria-hidden
                    className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${s.ok ? "bg-ok" : "bg-[#C84848]"}`}
                  />
                  <span>
                    <b className={s.ok ? "text-plum-deep" : "text-[#9B2C2C]"}>{s.step}</b>
                    <span className="text-muted"> — {s.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="a-card rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="font-serif text-lg text-plum-deep">In-person visits</h2>

        <label className="flex items-start gap-3 rounded-xl border border-black/5 bg-blush-soft/40 p-3.5 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-plum shrink-0"
            checked={settings.clinic_visit_enabled}
            onChange={(e) => setSettings({ ...settings, clinic_visit_enabled: e.target.checked })}
          />
          <span>
            <span className="block text-sm font-semibold text-plum-deep">
              Offer in-person visits to patients
            </span>
            <span className="block text-xs text-muted mt-0.5">
              {settings.clinic_visit_enabled
                ? "On — the clinic address, timings and map are shown on the home and contact pages, and patients booking online are told they can visit instead."
                : settings.online_consultation_enabled
                  ? "Off — every mention of visiting in person is replaced across the site. Patients are offered video consultations only. Nothing below is shown to them while this is off."
                  : "Off — and so is online consultation, so the public site is currently running as an information site with the clinic's phone number and inbox. Nothing below is shown to patients while this is off."}
            </span>
            <span className="block text-xs text-muted mt-1.5">
              Turn this off while the clinic is closed, moving, or fully booked in person. In-clinic visits are never
              booked through the website either way — this only controls whether they are offered.
            </span>
          </span>
        </label>

        <p className="text-xs text-muted">These details appear wherever in-person visits are mentioned.</p>
        <Field label="Address">
          <textarea
            className="input"
            rows={2}
            value={settings.clinic_address}
            onChange={(e) => setSettings({ ...settings, clinic_address: e.target.value })}
          />
        </Field>
        <Field label="Timings">
          <input className="input" value={settings.clinic_timing} onChange={(e) => setSettings({ ...settings, clinic_timing: e.target.value })} placeholder="Mon–Sat · 10 AM – 7 PM" />
        </Field>
        <Field label="Google Maps link">
          <input
            className="input"
            value={settings.clinic_map_link}
            onChange={(e) => setSettings({ ...settings, clinic_map_link: e.target.value })}
            placeholder="https://maps.google.com/?q=..."
          />
        </Field>
      </section>

      <section className="a-card rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="font-serif text-lg text-plum-deep">About Dr Hemangi</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Years of experience">
            <input
              type="number"
              className="input"
              value={settings.years_experience}
              onChange={(e) => setSettings({ ...settings, years_experience: Number(e.target.value) })}
            />
          </Field>
          <Field label="Successful deliveries">
            <input
              type="number"
              className="input"
              value={settings.deliveries_count}
              onChange={(e) => setSettings({ ...settings, deliveries_count: Number(e.target.value) })}
            />
          </Field>
        </div>
      </section>

      <section className="a-card rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="font-serif text-lg text-plum-deep">Patient support address</h2>
        <p className="text-xs text-muted -mt-2">
          Shown in the footer and on the contact page, for questions about bookings and payments and for reporting
          anything on the website that looks wrong. Patients email it directly — it is not a form.
        </p>
        <Field label="Support email">
          <input
            type="email"
            className="input"
            value={settings.support_email}
            onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
            placeholder="hello@drhemangi.in"
          />
        </Field>
        <p className="text-xs text-muted">
          Make sure this mailbox actually exists and is checked — a patient who emails a dead address gets a silent
          bounce and you never hear from them. Leave it blank to fall back to hello@drhemangi.in.
        </p>
      </section>

      <section className="a-card rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="font-serif text-lg text-plum-deep">Prescription signature</h2>
        <p className="text-xs text-muted">
          Printed at the bottom of every prescription emailed to a patient. A prescription without a registration
          number still sends — it just goes out without that line.
        </p>
        <Field label="Qualifications">
          <input
            className="input"
            value={settings.doctor_qualifications}
            onChange={(e) => setSettings({ ...settings, doctor_qualifications: e.target.value })}
            placeholder="M.B.B.S, DNB (Obs & Gynae), D.G.O, FMAS"
          />
        </Field>
        <Field label="Medical registration number">
          <input
            className="input"
            value={settings.doctor_registration_no}
            onChange={(e) => setSettings({ ...settings, doctor_registration_no: e.target.value })}
            placeholder="e.g. MCI / State Council registration number"
          />
        </Field>
      </section>

      <section className="a-card rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="font-serif text-lg text-plum-deep">Google Calendar &amp; Meet</h2>
        <p className="text-xs text-muted">
          Connect once so every confirmed booking automatically gets a Google Meet link on Dr Hemangi's calendar.
        </p>
        {settings.google_connected ? (
          <p className="text-sm text-ok font-medium">✓ Connected</p>
        ) : (
          <a
            href="/api/admin/auth/google"
            className="inline-block px-4 py-2 rounded-full bg-plum text-white text-xs font-semibold hover:bg-plum-deep"
          >
            Connect Google Calendar
          </a>
        )}
      </section>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-plum text-white text-sm font-semibold hover:bg-plum-deep disabled:opacity-50"
        >
          {saving && <span className="spin-sm" aria-hidden />}
          {saving ? "Saving…" : "Save changes"}
        </button>
        {msg && (
          <p
            role="status"
            aria-live="polite"
            className={
              "text-sm font-medium " + (msg.kind === "ok" ? "text-ok" : "text-red-700")
            }
          >
            {msg.text}
          </p>
        )}
      </div>

    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-plum-mid mb-1">{label}</span>
      {children}
    </label>
  );
}
