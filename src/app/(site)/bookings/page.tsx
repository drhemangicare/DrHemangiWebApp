import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPublicSettings } from "@/lib/site/settings";
import { BookingsManager } from "@/components/site/BookingsManager";

export const metadata: Metadata = {
  title: "My bookings",
  description: "Look up, reschedule or cancel your consultation with a one-time code sent to your email.",
  alternates: { canonical: "/bookings" },
  // Personal records behind an emailed code — keep it out of search indexes.
  robots: { index: false, follow: false },
};

export default async function BookingsPage() {
  const s = await getPublicSettings();
  // See the long note in /book: redirect, never notFound(). OFF is valid.
  if (!s.online_consultation_enabled) redirect("/");
  return (
    <main>
      <BookingsManager />
    </main>
  );
}
