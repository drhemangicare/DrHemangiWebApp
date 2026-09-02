"use client";
import { useEffect, useState, useCallback } from "react";

type Category = { id: string; name: string };
type Discount = {
  id: string;
  category_id: string | null;
  categories: { name: string } | null;
  label: string;
  discount_type: "percent" | "flat";
  amount: number;
  limit_type: "patient_count" | "date_range" | "unlimited";
  patient_limit: number | null;
  used_count: number;
  ends_at: string | null;
  is_active: boolean;
};

type DiscountForm = {
  category_id: string;
  label: string;
  discount_type: "percent" | "flat";
  amount: number;
  limit_type: "patient_count" | "date_range" | "unlimited";
  patient_limit: number;
  ends_at: string;
};

const EMPTY: DiscountForm = {
  category_id: "",
  label: "",
  discount_type: "percent",
  amount: 10,
  limit_type: "patient_count",
  patient_limit: 50,
  ends_at: "",
};

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/discounts").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
    ])
      .then(([d, c]) => {
        setDiscounts(d.discounts || []);
        setCategories(c.categories || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function create() {
    if (!form) return;
    const body: any = { ...form, category_id: form.category_id || null };
    if (form.limit_type !== "patient_count") delete body.patient_limit;
    if (form.limit_type !== "date_range") delete body.ends_at;
    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setForm(null);
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Could not create discount");
    }
  }

  async function toggle(d: Discount) {
    await fetch(`/api/admin/discounts/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !d.is_active }),
    });
    load();
  }

  async function remove(d: Discount) {
    if (!confirm(`Delete "${d.label}"?`)) return;
    await fetch(`/api/admin/discounts/${d.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-plum-deep">Discounts</h1>
          <p className="text-sm text-muted mt-1">
            Auto-expire by number of patients (e.g. first 50) or by a date window (e.g. 2 weeks) — whichever hits first.
          </p>
        </div>
        <button onClick={() => setForm({ ...EMPTY })} className="px-4 py-2 rounded-full bg-plum text-white text-sm font-semibold hover:bg-plum-deep">
          + New discount
        </button>
      </div>

      <div className="space-y-3">
        {discounts.map((d) => (
          <div key={d.id} className="bg-white/80 border border-black/5 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center gap-x-4 gap-y-3 shadow-sm">
            <div className="flex-1 min-w-[200px]">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-serif text-lg text-plum-deep leading-tight">{d.label}</span>
                {!d.is_active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 text-muted whitespace-nowrap">off</span>}
              </div>
              <p className="text-xs text-muted mt-1">
                {d.categories?.name || "All categories"} · {d.discount_type === "percent" ? `${d.amount}% off` : `₹${d.amount} off`}
              </p>
            </div>
            {/* usage + actions travel together, so they wrap as one
                right-aligned group instead of scattering across the card */}
            <div className="flex items-center gap-3 ml-auto">
              <div className="text-sm text-plum-mid whitespace-nowrap">
                {d.limit_type === "patient_count" && `${d.used_count}/${d.patient_limit} used`}
                {d.limit_type === "date_range" && d.ends_at && `Ends ${new Date(d.ends_at).toLocaleDateString("en-IN")}`}
                {d.limit_type === "unlimited" && "No limit"}
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggle(d)} className="px-3 py-1.5 rounded-full border border-black/10 text-xs font-semibold text-plum-mid hover:border-plum transition">
                  {d.is_active ? "Pause" : "Resume"}
                </button>
                <button onClick={() => remove(d)} className="px-3 py-1.5 rounded-full border border-danger/30 text-xs font-semibold text-danger hover:bg-danger/5 transition">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loading && discounts.length === 0 && <p className="text-sm text-muted">No discounts yet.</p>}
      </div>

      {form && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-plum-deep/40 backdrop-blur-sm" onClick={() => setForm(null)} />
          <div className="relative bg-cream rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-3">
            <h2 className="font-serif text-xl text-plum-deep mb-2">New discount</h2>
            <Field label="Label (shown to patients)">
              <input className="input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Launch offer" />
            </Field>
            <Field label="Applies to">
              <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select className="input" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as any })}>
                  <option value="percent">Percent off</option>
                  <option value="flat">Flat ₹ off</option>
                </select>
              </Field>
              <Field label={form.discount_type === "percent" ? "Percent" : "Amount (₹)"}>
                <input type="number" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
              </Field>
            </div>
            <Field label="Expires when…">
              <select className="input" value={form.limit_type} onChange={(e) => setForm({ ...form, limit_type: e.target.value as any })}>
                <option value="patient_count">A number of patients use it</option>
                <option value="date_range">A date is reached</option>
                <option value="unlimited">Never (manual pause only)</option>
              </select>
            </Field>
            {form.limit_type === "patient_count" && (
              <Field label="Number of patients (e.g. next 50)">
                <input
                  type="number"
                  className="input"
                  value={form.patient_limit}
                  onChange={(e) => setForm({ ...form, patient_limit: Number(e.target.value) })}
                />
              </Field>
            )}
            {form.limit_type === "date_range" && (
              <Field label="Ends on (e.g. 2 weeks from now)">
                <input type="date" className="input" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
              </Field>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setForm(null)} className="px-4 py-2 rounded-full text-sm text-muted">
                Cancel
              </button>
              <button onClick={create} className="px-4 py-2 rounded-full bg-plum text-white text-sm font-semibold hover:bg-plum-deep">
                Create
              </button>
            </div>
          </div>
        </div>
      )}

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
