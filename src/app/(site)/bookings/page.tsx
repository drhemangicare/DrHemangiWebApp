import type { Metadata } from "next";
import { BookingsManager } from "@/components/site/BookingsManager";

export const metadata: Metadata = {
  title: "My bookings",
  description: "Look up, reschedule or cancel your consultation with a one-time code sent to your email.",
  alternates: { canonical: "/bookings" },
  // Personal records behind an emailed code — keep it out of search indexes.
  robots: { index: false, follow: false },
};

export default function BookingsPage() {
  return (
    <main>
      <BookingsManager />
    </main>
  );
}
