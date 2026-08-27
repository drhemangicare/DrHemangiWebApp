export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmt12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
}

export function fmtDate(d: Date): string {
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function dateFromIso(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  effective_price: number;
  discount_amount: number;
  discount_label?: string | null;
  duration_minutes: number;
  existing_patients_only?: boolean;
};

export type Slot = { time: string; available: boolean };
export type Day = { date: string; offDay?: boolean; slots: Slot[] };
