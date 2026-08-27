import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund policy",
  description: "When a consultation fee is refunded, and how much.",
  alternates: { canonical: "/refund-policy" },
};

export default function Page() {
  return (
    <main>
      <section className="pg-head">
        <div className="wrap-n">
          <div className="head rv">
            <span className="eyebrow">Legal</span>
            <h2>Refund policy</h2>
            <p className="lede">When a consultation fee is refunded, and how much.</p>
          </div>
          <div className="card" style={{ padding: "clamp(24px,4vw,40px)" }}>
            <p style={{ color: "var(--muted)", fontSize: ".92rem", lineHeight: 1.75 }}>
              This page is a placeholder. The clinic&apos;s final refund policy wording should be added here before
              launch — it is linked from the footer of every page.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
