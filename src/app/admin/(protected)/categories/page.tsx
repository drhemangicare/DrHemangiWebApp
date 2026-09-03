"use client";
import { SectionTabs, PRICING_TABS } from "@/components/admin/section-tabs";
import { useState, useCallback } from "react";
import { useAdminData, invalidateAdminCache } from "@/components/admin/use-admin-data";

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  duration_minutes: number;
  sort_order: number;
  is_active: boolean;
  existing_patients_only: boolean;
};

const EMPTY: Omit<Category, "id"> = {
  slug: "",
  name: "",
  description: "",
  icon: "stethoscope",
  price: 700,
  duration_minutes: 30,
  sort_order: 0,
  is_active: true,
  existing_patients_only: false,
};

export default function AdminCategoriesPage() {
  const [editing, setEditing] = useState<Category | (typeof EMPTY & { id?: string }) | null>(null);

  /* Shared cache: revisiting this tab paints the last list immediately and
     refreshes it behind you, rather than clearing to a skeleton every time. */
  const { data, loading, refresh } = useAdminData<{ categories: Category[] }>("/api/admin/categories");
  const categories = data?.categories ?? [];

  /* Prices appear inside discounts too, so a save has to drop both. */
  const load = useCallback(() => {
    invalidateAdminCache("/api/admin/categories");
    invalidateAdminCache("/api/admin/discounts");
    refresh();
  }, [refresh]);

  async function save() {
    if (!editing) return;
    const isNew = !("id" in editing) || !editing.id;
    const url = isNew ? "/api/admin/categories" : `/api/admin/categories/${(editing as Category).id}`;
    const method = isNew ? "POST" : "PATCH";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      setEditing(null);
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Could not save");
    }
  }

  async function toggleActive(c: Category) {
    await fetch(`/api/admin/categories/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !c.is_active }),
    });
    load();
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-plum-deep">Pricing &amp; categories</h1>
          <p className="text-sm text-muted mt-1">What patients can book, and how much each consultation costs.</p>
        </div>
      <SectionTabs tabs={PRICING_TABS} />
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="px-4 py-2 rounded-full bg-plum text-white text-sm font-semibold hover:bg-plum-deep transition"
        >
          + New category
        </button>
      </div>

      <div className="space-y-3">
        {categories.map((c) => (
          <div key={c.id} className="a-card rounded-2xl p-4 sm:p-5 flex flex-wrap items-center gap-x-4 gap-y-3 shadow-sm">
            <div className="flex-1 min-w-[200px]">
              {/* wrap the badges, so a long name + pill don't squeeze each
                  other into ragged two-line text on a phone */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-serif text-lg text-plum-deep leading-tight">{c.name}</span>
                {!c.is_active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 text-muted whitespace-nowrap">hidden</span>}
                {c.existing_patients_only && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-plum-mid whitespace-nowrap">returning patients only</span>
                )}
              </div>
              <p className="text-xs text-muted mt-1">{c.description}</p>
            </div>
            {/* price + actions travel together, so they wrap as one right-aligned
                group instead of scattering across the card */}
            <div className="flex items-center gap-3 ml-auto">
              <div className="text-sm text-plum-mid whitespace-nowrap">₹{c.price} · {c.duration_minutes} min</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(c)}
                  className="px-3 py-1.5 rounded-full border border-black/10 text-xs font-semibold text-plum-mid hover:border-plum transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(c)}
                  className="px-3 py-1.5 rounded-full border border-black/10 text-xs font-semibold text-plum-mid hover:border-plum transition"
                >
                  {c.is_active ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loading && categories.length === 0 && <p className="text-sm text-muted">No categories yet — add your first one.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-plum-deep/40 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative bg-cream rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-3">
            <h2 className="font-serif text-xl text-plum-deep mb-2">{"id" in editing && editing.id ? "Edit category" : "New category"}</h2>
            <Field label="Name">
              <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <Field label="Slug (used in booking links)">
              <input className="input" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
            </Field>
            <Field label="Description">
              <textarea
                className="input"
                rows={2}
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (₹)">
                <input
                  type="number"
                  className="input"
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                />
              </Field>
              <Field label="Duration (min)">
                <input
                  type="number"
                  className="input"
                  value={editing.duration_minutes}
                  onChange={(e) => setEditing({ ...editing, duration_minutes: Number(e.target.value) })}
                />
              </Field>
            </div>
            <label className="flex items-start gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={editing.existing_patients_only}
                onChange={(e) => setEditing({ ...editing, existing_patients_only: e.target.checked })}
              />
              <span className="text-xs text-plum-mid">
                Existing patients only — blocks a first-time booking of this category. Checked at booking time
                against the patient&apos;s phone/email having a prior paid visit, not just self-declared.
              </span>
            </label>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-full text-sm text-muted">
                Cancel
              </button>
              <button onClick={save} className="px-4 py-2 rounded-full bg-plum text-white text-sm font-semibold hover:bg-plum-deep">
                Save
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
