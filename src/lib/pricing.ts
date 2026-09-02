import { supabaseAdmin } from "@/lib/supabase/server";

export type Discount = {
  id: string;
  category_id: string | null;
  label: string;
  discount_type: "percent" | "flat";
  amount: number;
  limit_type: "patient_count" | "date_range" | "unlimited";
  patient_limit: number | null;
  used_count: number;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
};

/** A discount is currently usable if it's active, within its date window (if any),
 *  and hasn't hit its patient cap (if any). Category-specific discounts win over
 *  clinic-wide ones when both apply. */
export function isDiscountLive(d: Discount, now = new Date()): boolean {
  if (!d.is_active) return false;
  if (new Date(d.starts_at) > now) return false;
  if (d.limit_type === "date_range" && d.ends_at && new Date(d.ends_at) < now) return false;
  if (d.limit_type === "patient_count" && d.patient_limit != null && d.used_count >= d.patient_limit) {
    return false;
  }
  return true;
}

export function applyDiscount(price: number, d: Discount | null): { finalPrice: number; discountAmount: number } {
  if (!d) return { finalPrice: price, discountAmount: 0 };
  const raw = d.discount_type === "percent" ? (price * d.amount) / 100 : d.amount;
  const discountAmount = Math.min(Math.round(raw * 100) / 100, price);
  const finalPrice = Math.round((price - discountAmount) * 100) / 100;
  return { finalPrice, discountAmount };
}

export function discountLabel(d: Discount): string {
  const amountLabel = d.discount_type === "percent" ? `${d.amount}% off` : `₹${d.amount} off`;
  if (d.limit_type === "patient_count" && d.patient_limit != null) {
    const left = Math.max(0, d.patient_limit - d.used_count);
    return `${amountLabel} · ${left} left`;
  }
  if (d.limit_type === "date_range" && d.ends_at) {
    const days = Math.max(1, Math.ceil((new Date(d.ends_at).getTime() - Date.now()) / 86400000));
    return `${amountLabel} · ends in ${days}d`;
  }
  return amountLabel;
}

/** Fetches all live discounts once and returns a lookup function, so callers
 *  pricing many categories don't issue one query per category. */
export async function loadLiveDiscounts(): Promise<Discount[]> {
  const { data, error } = await supabaseAdmin()
    .from("discounts")
    .select("*")
    .eq("is_active", true);
  if (error) throw error;
  const now = new Date();
  return (data || []).filter((d) => isDiscountLive(d as Discount, now)) as Discount[];
}

export function bestDiscountFor(discounts: Discount[], categoryId: string): Discount | null {
  const specific = discounts.find((d) => d.category_id === categoryId);
  if (specific) return specific;
  const general = discounts.find((d) => d.category_id === null);
  return general || null;
}
