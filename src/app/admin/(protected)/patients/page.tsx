"use client";
import { useEffect, useState } from "react";
import { useAdminData } from "@/components/admin/use-admin-data";

type Patient = {
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
};

type Medicine = { name: string; dose: string; frequency: string; duration: string; notes: string };

type Visit = {
  id: string;
  reference_code: string;
  date: string;
  time: string;
  duration_minutes: number;
  service: string;
  status: string;
  payment_status: string;
  price_final: number;
  reason: string;
  doctor_notes: string;
  document_count: number;
  prescription: {
    diagnosis: string;
    medicines: Medicine[];
    advice: string;
    follow_up_date: string | null;
    sent_at: string | null;
  } | null;
};

type Profile = {
  patient: {
    name: string;
    email: string;
    phone: string;
    age: number | null;
    total_visits: number;
    first_seen: string | null;
    last_seen: string | null;
    next_follow_up: string | null;
  };
  upcoming: Visit[];
  past: Visit[];
  prescriptionsAvailable: boolean;
};

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-ok/10 text-ok",
  pending_payment: "bg-warn/10 text-warn",
  completed: "bg-black/5 text-muted",
  cancelled: "bg-danger/10 text-danger",
  rescheduled: "bg-gold/20 text-[#8A6A34]",
  no_show: "bg-black/5 text-muted",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function PatientsPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  /* Debounce the QUERY, not the request. The old code delayed the fetch itself
     by 250ms on every mount — a quarter-second of nothing before the section
     even asked for data. Debouncing the value instead means the first load
     fires immediately and only typing waits. */
  useEffect(() => {
    if (q === debouncedQ) return;
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q, debouncedQ]);

  const { data, loading, error } = useAdminData<{ patients: Patient[] }>(
    `/api/admin/patients${debouncedQ ? `?q=${encodeURIComponent(debouncedQ)}` : ""}`,
  );
  const rows = data?.patients ?? [];

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-plum-deep">Patients</h1>
          <p className="text-sm text-muted mt-1">
            Everyone who has ever booked, with their full consultation history.
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email or phone…"
          className="px-3.5 py-2 rounded-full border border-black/10 bg-white text-sm outline-none focus:border-plum w-72"
        />
      </div>

      {error && (
        <p className="text-sm text-[#9B2C2C] bg-danger/10 rounded-xl px-4 py-3 mb-4">{error}</p>
      )}

      <div className="a-card rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted border-b border-black/5">
                <th className="px-4 py-3 font-semibold">Patient</th>
                <th className="px-4 py-3 font-semibold">Consultations</th>
                <th className="px-4 py-3 font-semibold">Last seen</th>
                <th className="px-4 py-3 font-semibold">Next appointment</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                rows.length === 0 &&
                [0, 1, 2, 3, 4].map((i) => (
                  <tr key={i} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3"><div className="sk h-4 w-44 mb-1.5" /><div className="sk h-3 w-56" /></td>
                    <td className="px-4 py-3"><div className="sk h-4 w-16" /></td>
                    <td className="px-4 py-3"><div className="sk h-4 w-24" /></td>
                    <td className="px-4 py-3"><div className="sk h-4 w-24" /></td>
                  </tr>
                ))}

              {rows.map((p) => (
                <tr
                  key={p.email}
                  onClick={() => setSelected(p.email)}
                  className="border-b border-black/5 last:border-0 hover:bg-blush-soft/40 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-plum-deep">{p.name}</div>
                    <div className="text-xs text-muted">
                      {p.email} · +91 {p.phone}
                      {p.age ? ` · ${p.age} yrs` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-plum-mid">
                    {p.visits}
                    {p.cancelled > 0 && <span className="text-xs text-muted-2"> · {p.cancelled} cancelled</span>}
                  </td>
                  <td className="px-4 py-3 text-plum-mid whitespace-nowrap">
                    {fmtDate(p.lastVisit)}
                    {p.lastService && <div className="text-xs text-muted-2">{p.lastService}</div>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {p.nextVisit ? (
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-ok/10 text-ok font-semibold">
                        {fmtDate(p.nextVisit)}
                      </span>
                    ) : (
                      <span className="text-muted-2">—</span>
                    )}
                  </td>
                </tr>
              ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <p className="text-sm text-plum-deep font-medium">
                      {q ? "No patient matches that search." : "No patients yet."}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {q
                        ? "Try part of a name, an email address, or a phone number."
                        : "Patients appear here automatically as soon as their first consultation is booked."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <PatientProfile email={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function PatientProfile({ email, onClose }: { email: string; onClose: () => void }) {
  const [data, setData] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(null);
    fetch(`/api/admin/patients/${encodeURIComponent(email)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!alive) return;
        if (!r.ok) setError(d.error || `Could not load this patient (${r.status}).`);
        else setData(d);
      })
      .catch(() => alive && setError("Could not reach the server."));
    return () => {
      alive = false;
    };
  }, [email]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="Patient history">
      <div className="absolute inset-0 bg-plum-deep/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl h-full bg-cream shadow-2xl overflow-y-auto">
        <div className="sticky top-0 z-10 a-glass border-b border-black/5 px-6 py-4 flex items-center justify-between">
          <h2 className="font-serif text-xl text-plum-deep">Patient history</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-plum-deep text-xl leading-none">
            ×
          </button>
        </div>

        {error && (
          <div className="p-6">
            <p className="text-sm text-[#9B2C2C]">{error}</p>
          </div>
        )}

        {!data && !error && (
          <div className="p-6 space-y-4">
            <div className="sk h-6 w-52" />
            <div className="sk h-4 w-72" />
            <div className="sk h-24 w-full" />
            <div className="sk h-32 w-full" />
          </div>
        )}

        {data && (
          <div className="p-6 space-y-6">
            <div>
              <div className="font-serif text-xl text-plum-deep">{data.patient.name}</div>
              <div className="text-sm text-muted">
                {data.patient.email} · +91 {data.patient.phone}
                {data.patient.age ? ` · ${data.patient.age} yrs` : ""}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                ["Consultations", String(data.patient.total_visits)],
                ["First seen", fmtDate(data.patient.first_seen)],
                ["Last seen", fmtDate(data.patient.last_seen)],
                ["Follow-up due", fmtDate(data.patient.next_follow_up)],
              ].map(([label, value]) => (
                <div key={label} className="a-card rounded-xl px-3.5 py-3">
                  <div className="text-[10px] uppercase tracking-wide text-muted-2 font-semibold">{label}</div>
                  <div className="text-sm text-plum-deep font-medium mt-0.5">{value}</div>
                </div>
              ))}
            </div>

            {!data.prescriptionsAvailable && (
              <p className="text-xs text-warn bg-warn/10 rounded-xl px-3.5 py-2.5">
                Prescriptions are not shown because the prescriptions table does not exist yet. Run
                supabase/migrations/0006_prescriptions.sql to include them here.
              </p>
            )}

            {data.upcoming.length > 0 && (
              <Section title="Upcoming">
                {data.upcoming.map((v) => <VisitCard key={v.id} v={v} />)}
              </Section>
            )}

            <Section title={`Past consultations (${data.past.length})`}>
              {data.past.length === 0 ? (
                <p className="text-sm text-muted">No past consultations yet.</p>
              ) : (
                data.past.map((v) => <VisitCard key={v.id} v={v} />)
              )}
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-2.5">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

/**
 * One visit. Everything about that day in one card, in the order a doctor
 * reads it: when and what, why they came, what was found, what was given.
 * Empty fields are omitted rather than rendered as "—" rows, so a short visit
 * stays short and the eye is not asked to skip over blanks.
 */
function VisitCard({ v }: { v: Visit }) {
  const rx = v.prescription;
  return (
    <div className="a-card rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm font-semibold text-plum-deep">
            {fmtDate(v.date)} · {v.time}
          </div>
          <div className="text-xs text-muted mt-0.5">
            {v.service} · {v.duration_minutes} min · ₹{v.price_final} · {v.reference_code}
          </div>
        </div>
        <span
          className={`text-[11px] px-2.5 py-1 rounded-full font-medium capitalize ${
            STATUS_STYLES[v.status] || "bg-black/5"
          }`}
        >
          {v.status.replace("_", " ")}
        </span>
      </div>

      {v.reason && <Field label="Reason for visit">{v.reason}</Field>}
      {v.doctor_notes && <Field label="Consultation notes">{v.doctor_notes}</Field>}

      {rx && (rx.diagnosis || rx.medicines.length > 0 || rx.advice) && (
        <div className="mt-3 pt-3 border-t border-black/5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase tracking-wide text-gold font-semibold">Prescription</span>
            {rx.sent_at ? (
              <span className="text-[10px] text-ok">sent {fmtDate(rx.sent_at.slice(0, 10))}</span>
            ) : (
              <span className="text-[10px] text-warn">draft — not sent</span>
            )}
          </div>

          {rx.diagnosis && <Field label="Diagnosis">{rx.diagnosis}</Field>}

          {rx.medicines.length > 0 && (
            <ul className="mt-2 space-y-1">
              {rx.medicines.map((m, i) => (
                <li key={i} className="text-xs text-plum-deep">
                  <b className="font-semibold">{m.name}</b>
                  {[m.dose, m.frequency, m.duration].filter(Boolean).length > 0 && (
                    <span className="text-muted"> — {[m.dose, m.frequency, m.duration].filter(Boolean).join(" · ")}</span>
                  )}
                  {m.notes && <span className="text-muted-2"> ({m.notes})</span>}
                </li>
              ))}
            </ul>
          )}

          {rx.advice && <Field label="Advice">{rx.advice}</Field>}
          {rx.follow_up_date && <Field label="Follow-up">{fmtDate(rx.follow_up_date)}</Field>}
        </div>
      )}

      {v.document_count > 0 && (
        <p className="text-[11px] text-muted-2 mt-2.5">
          {v.document_count} report{v.document_count === 1 ? "" : "s"} attached — open the booking to view.
        </p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-2 font-semibold">{label}</div>
      <p className="text-xs text-plum-deep leading-relaxed whitespace-pre-wrap mt-0.5">{children}</p>
    </div>
  );
}
