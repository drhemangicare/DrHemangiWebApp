"use client";
import { useEffect, useState } from "react";

type Medicine = { name: string; dose: string; frequency: string; duration: string; notes: string };
const BLANK: Medicine = { name: "", dose: "", frequency: "", duration: "", notes: "" };

type Saved = {
  diagnosis: string | null;
  medicines: Medicine[] | null;
  advice: string | null;
  follow_up_date: string | null;
  sent_at: string | null;
  sent_to: string | null;
  revision: number | null;
  updated_at: string | null;
};

/* A stable, comparable shape for "what is in the form" and "what is stored".
   Dirty state is computed by comparing these two, so it can never drift out of
   sync with an `isDirty` boolean someone forgot to set. Blank medicine rows are
   dropped exactly as the API drops them, otherwise the empty row the composer
   always shows would make a freshly-loaded prescription look edited. */
function fingerprint(diagnosis: string, medicines: Medicine[], advice: string, followUp: string) {
  return JSON.stringify({
    d: diagnosis.trim(),
    a: advice.trim(),
    f: followUp || null,
    m: medicines
      .filter((m) => m.name.trim() || m.dose.trim() || m.frequency.trim() || m.duration.trim() || m.notes.trim())
      .map((m) => [m.name.trim(), m.dose.trim(), m.frequency.trim(), m.duration.trim(), m.notes.trim()]),
  });
}

/* Common shorthand, offered as one tap each. Typing "1-0-1" forty times a day
   is the kind of friction that makes a doctor stop using the tool and go back
   to paper.

   These are rendered as VISIBLE CHIPS, not just as a `<datalist>`. A datalist
   only appears once you focus the field and start typing, so its suggestions
   are invisible exactly when you are deciding what to type — the affordance
   may as well not exist. The chips also stop being a fixed vocabulary: the
   field underneath stays free text, and a chip just fills it in. */
const FREQUENCIES = ["1-0-0", "0-1-0", "0-0-1", "1-0-1", "1-1-1", "SOS"];
const DURATIONS = ["3 days", "5 days", "7 days", "10 days", "15 days", "1 month"];

/** A field label that is always visible, rather than a placeholder that
    disappears the moment the doctor types into the box. */
function L({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <span className="flex items-baseline gap-1.5 mb-1">
      <span className="text-[11px] font-semibold text-plum-deep">{children}</span>
      {/* --muted, not --muted-2: the hint explains the FORMAT ("morning-noon-night"),
          so it is information, not decoration, and 3.05:1 was not legible enough
          for 10px type. --muted measures 4.65:1 on white. */}
      {hint && <span className="text-[10px] text-muted">{hint}</span>}
    </span>
  );
}

/** One-tap chips that fill the field beneath them. */
function Chips({ options, onPick }: { options: string[]; onPick: (v: string) => void }) {
  return (
    <span className="flex flex-wrap gap-1 mt-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onPick(o)}
          className="px-2 py-[3px] rounded-full border border-plum/15 bg-white/70 text-[11px] text-plum-mid hover:border-plum/40 hover:text-plum-deep hover:bg-white press"
        >
          {o}
        </button>
      ))}
    </span>
  );
}

export function PrescriptionComposer({
  bookingId,
  patientName,
  patientEmail,
}: {
  bookingId: string;
  patientName: string;
  patientEmail: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([{ ...BLANK }]);
  const [advice, setAdvice] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [saved, setSaved] = useState<Saved | null>(null);
  const [busy, setBusy] = useState<null | "save" | "send">(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);
  /* The fingerprint of the last version the SERVER confirmed it stored — not
     of the last thing we sent it. A failed save must leave the form dirty. */
  const [savedPrint, setSavedPrint] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/bookings/${bookingId}/prescription`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const p: Saved | null = d.prescription ?? null;
        if (p) {
          setSaved(p);
          setDiagnosis(p.diagnosis ?? "");
          setAdvice(p.advice ?? "");
          setFollowUp(p.follow_up_date ?? "");
          setMedicines(p.medicines?.length ? p.medicines : [{ ...BLANK }]);
          setSavedPrint(
            fingerprint(p.diagnosis ?? "", p.medicines ?? [], p.advice ?? "", p.follow_up_date ?? ""),
          );
        }
        if (d.error) setMsg({ kind: "err", text: d.error });
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [bookingId]);

  function setMed(i: number, patch: Partial<Medicine>) {
    setMedicines((ms) => ms.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  }

  async function save(): Promise<Saved | null> {
    setBusy("save");
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/prescription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosis, medicines, advice, follow_up_date: followUp || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        /* Leave savedPrint alone: the draft is still unsaved, so the form
           stays dirty and Send stays locked. A failed save must never look
           like a successful one. */
        setMsg({ kind: "err", text: data.error || `Could not save (${res.status}).` });
        return null;
      }
      const p: Saved = data.prescription;
      setSaved(p);
      setSavedPrint(fingerprint(p.diagnosis ?? "", p.medicines ?? [], p.advice ?? "", p.follow_up_date ?? ""));
      setMsg({ kind: "ok", text: "Draft saved. Nothing has been emailed yet." });
      return p;
    } catch {
      setMsg({ kind: "err", text: "Could not reach the server — the draft is NOT saved." });
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function send() {
    setBusy("send");
    setMsg(null);
    try {
      /* No prescription content goes up: the endpoint emails the stored row.
         `expectedUpdatedAt` says which stored version we believe we are
         sending, so a row changed elsewhere is refused rather than mailed. */
      const res = await fetch(`/api/admin/bookings/${bookingId}/prescription/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedUpdatedAt: saved?.updated_at ?? undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ kind: "err", text: data.error || `Could not send (${res.status}).` });
        return;
      }
      if (data.prescription) setSaved(data.prescription);
      setMsg({
        kind: "ok",
        text: `Sent to ${patientEmail} with the PDF attached.${data.warning ? " " + data.warning : ""}`,
      });
      setConfirmSend(false);
    } catch {
      setMsg({ kind: "err", text: "Could not reach the server." });
    } finally {
      setBusy(null);
    }
  }

  const filledMeds = medicines.filter((m) => m.name.trim());
  const hasContent = filledMeds.length > 0 || advice.trim() || diagnosis.trim();
  const currentPrint = fingerprint(diagnosis, medicines, advice, followUp);
  /* Dirty = the form differs from what the server confirmed it stored.
     Never saved at all also counts as dirty. */
  const dirty = savedPrint === null || currentPrint !== savedPrint;
  const canSend = !dirty && hasContent && !!patientEmail && busy === null;

  if (loading) {
    return (
      <section className="a-card rounded-2xl p-5 space-y-4">
        <div className="sk h-5 w-44" />
        <div className="sk h-20 w-full" />
        <div className="sk h-32 w-full" />
      </section>
    );
  }

  return (
    <section className="a-card rounded-2xl p-5 space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-serif text-lg text-plum-deep">Prescription &amp; advice</h2>
          <p className="text-xs text-muted mt-0.5">
            For {patientName}
            {patientEmail ? ` · ${patientEmail}` : " · no email on file"}
          </p>
        </div>
        {/* One chip, one truth: unsaved beats everything, because it is the
            state that changes what the buttons will do. */}
        {dirty ? (
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-warn/12 text-warn font-semibold">
            {savedPrint === null ? "Not saved yet" : "Unsaved changes"}
          </span>
        ) : saved?.sent_at ? (
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-ok/10 text-ok font-semibold">
            Sent {new Date(saved.sent_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            {saved.revision && saved.revision > 1 ? ` · v${saved.revision}` : ""}
          </span>
        ) : (
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-black/5 text-muted font-semibold">
            Draft saved
          </span>
        )}
      </div>

      <label className="block">
        <L hint="appears at the top of the patient's email">Diagnosis / impression</L>
        <textarea
          className="input"
          rows={2}
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="PCOS with insulin resistance"
        />
      </label>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-plum-deep">Medicines</label>
          <span className="text-[11px] text-muted-2">{filledMeds.length} added</span>
        </div>

        <div className="space-y-3">
          {medicines.map((m, i) => (
            <div key={i} className="rounded-xl border border-black/[0.07] bg-white/70 p-3.5">
              {/* Numbered, with a worded Remove — a bare "×" beside a text
                  field reads as "clear this box", not "delete this medicine". */}
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-2">
                  Medicine {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setMedicines((ms) => (ms.length === 1 ? [{ ...BLANK }] : ms.filter((_, j) => j !== i)))
                  }
                  className="text-[11px] font-semibold text-muted hover:text-[#9B2C2C] press"
                >
                  {medicines.length === 1 ? "Clear" : "Remove"}
                </button>
              </div>

              <label className="block mb-2.5">
                <L>Medicine name</L>
                <input
                  className="input"
                  placeholder="Tab. Metformin"
                  value={m.name}
                  onChange={(e) => setMed(i, { name: e.target.value })}
                />
              </label>

              <div className="grid sm:grid-cols-3 gap-2.5">
                <label className="block">
                  <L>Dose</L>
                  <input
                    className="input"
                    placeholder="500 mg"
                    value={m.dose}
                    onChange={(e) => setMed(i, { dose: e.target.value })}
                  />
                </label>

                <label className="block">
                  <L hint="morning-noon-night">When</L>
                  <input
                    className="input"
                    placeholder="1-0-1"
                    list="rx-freq"
                    value={m.frequency}
                    onChange={(e) => setMed(i, { frequency: e.target.value })}
                  />
                </label>

                <label className="block">
                  <L>How long</L>
                  <input
                    className="input"
                    placeholder="7 days"
                    list="rx-dur"
                    value={m.duration}
                    onChange={(e) => setMed(i, { duration: e.target.value })}
                  />
                </label>
              </div>

              <div className="grid sm:grid-cols-3 gap-2.5 mt-0.5">
                <span className="hidden sm:block" />
                <Chips options={FREQUENCIES} onPick={(v) => setMed(i, { frequency: v })} />
                <Chips options={DURATIONS} onPick={(v) => setMed(i, { duration: v })} />
              </div>

              <label className="block mt-3">
                <L hint="optional">Instructions</L>
                <input
                  className="input"
                  placeholder="After food · avoid with milk · stop if rash appears"
                  value={m.notes}
                  onChange={(e) => setMed(i, { notes: e.target.value })}
                />
              </label>
            </div>
          ))}
        </div>

        <datalist id="rx-freq">{FREQUENCIES.map((f) => <option key={f} value={f} />)}</datalist>
        <datalist id="rx-dur">{DURATIONS.map((d) => <option key={d} value={d} />)}</datalist>

        <button
          type="button"
          onClick={() => setMedicines((ms) => [...ms, { ...BLANK }])}
          className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-plum/20 text-plum text-xs font-semibold hover:bg-plum/5 press"
        >
          + Add another medicine
        </button>
      </div>

      <label className="block">
        <L hint="line breaks are kept">Advice</L>
        <textarea
          className="input"
          rows={4}
          value={advice}
          onChange={(e) => setAdvice(e.target.value)}
          placeholder={"Diet and activity\nWarning signs to watch for\nWhat to do if symptoms change"}
        />
      </label>

      <label className="block max-w-[240px]">
        <L hint="optional">Follow-up date</L>
        <input type="date" className="input" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
      </label>

      {/* Sending is irreversible — it lands in a patient's inbox — so it takes
          a second, deliberate click. Saving does not. */}
      <div className="flex items-center gap-3 flex-wrap pt-1">
        <button
          onClick={save}
          disabled={busy !== null || !dirty}
          title={!dirty ? "No changes to save" : undefined}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-plum/20 text-plum text-sm font-semibold hover:bg-plum/5 disabled:opacity-40"
        >
          {busy === "save" && <span className="spin-sm" aria-hidden />}
          {busy === "save" ? "Saving…" : "Save draft"}
        </button>

        <a
          href={saved && !dirty ? `/api/admin/bookings/${bookingId}/prescription/pdf` : undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!saved || dirty}
          onClick={(e) => {
            if (!saved || dirty) {
              e.preventDefault();
              setMsg({ kind: "err", text: "Save the draft first — the preview shows the saved version." });
            }
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold press ${
            saved && !dirty
              ? "border-plum/20 text-plum hover:bg-plum/5"
              : "border-black/10 text-muted-2 cursor-not-allowed"
          }`}
        >
          Preview PDF
        </a>

        {/* `|| dirty` withdraws a pending confirmation the moment anything is
            edited. Otherwise the doctor could open the prompt, change a dose,
            and press "Yes, send" believing the change went with it — the send
            endpoint would (correctly) mail the older saved row instead.
            Derived from state rather than reset by an effect, so it cannot
            fall out of step with the form. */}
        {!confirmSend || dirty ? (
          <button
            onClick={() => setConfirmSend(true)}
            disabled={!canSend}
            title={
              dirty
                ? "Save the draft before sending"
                : !patientEmail
                  ? "This booking has no email address"
                  : !hasContent
                    ? "Nothing to send yet"
                    : undefined
            }
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-plum text-white text-sm font-semibold hover:bg-plum-deep disabled:opacity-40"
          >
            {saved?.sent_at ? "Send updated prescription" : "Send to patient"}
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 flex-wrap">
            <span className="text-xs text-plum-deep">Email the saved prescription to {patientEmail}?</span>
            <button
              onClick={send}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-plum text-white text-xs font-semibold hover:bg-plum-deep disabled:opacity-50"
            >
              {busy === "send" && <span className="spin-sm" aria-hidden />}
              {busy === "send" ? "Sending…" : "Yes, send"}
            </button>
            <button
              onClick={() => setConfirmSend(false)}
              disabled={busy !== null}
              className="px-3 py-2 rounded-full text-xs font-semibold text-muted hover:text-plum-deep"
            >
              Cancel
            </button>
          </div>
        )}

        {msg && (
          <p
            role="status"
            aria-live="polite"
            className={`text-xs ${msg.kind === "ok" ? "text-ok" : "text-[#9B2C2C]"}`}
          >
            {msg.text}
          </p>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-muted-2 border-t border-black/5 pt-3">
        The patient gets the prescription in the email itself <b>and</b> as a printable A4 PDF attachment, under Dr
        Hemangi&apos;s name and registration number, with a note that this inbox is not monitored for emergencies. Set
        the registration number and qualifications in Settings so they appear on both.
      </p>
    </section>
  );
}
