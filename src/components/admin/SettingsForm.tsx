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

      <section className="bg-white/80 border border-black/5 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="font-serif text-lg text-plum-deep">Doctor's photo</h2>
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
              className="px-4 py-2 rounded-full bg-plum text-white text-xs font-semibold hover:bg-plum-deep disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Upload photo"}
            </button>
            <p className="text-xs text-muted mt-1.5">Square-ish photo, at least 600×600px works best. Replaces the placeholder illustration on the homepage automatically.</p>
          </div>
        </div>
      </section>

      <section className="bg-white/80 border border-black/5 rounded-2xl p-5 shadow-sm space-y-4">
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
                : "Off — every mention of visiting in person is hidden across the site. Patients are only offered video consultations. Nothing below is shown to them while this is off."}
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

      <section className="bg-white/80 border border-black/5 rounded-2xl p-5 shadow-sm space-y-4">
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

      <section className="bg-white/80 border border-black/5 rounded-2xl p-5 shadow-sm space-y-4">
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

      <section className="bg-white/80 border border-black/5 rounded-2xl p-5 shadow-sm space-y-3">
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
          className="px-5 py-2.5 rounded-full bg-plum text-white text-sm font-semibold hover:bg-plum-deep disabled:opacity-50"
        >
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
