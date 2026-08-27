"use client";
import { useState } from "react";
import { FAQS } from "@/lib/site/content";

export function FaqList({ limit }: { limit?: number }) {
  const [open, setOpen] = useState<number | null>(null);
  const list = limit ? FAQS.slice(0, limit) : FAQS;
  return (
    <div className="faq rv">
      {list.map(([q, a], i) => (
        <div className={`fq${open === i ? " on" : ""}`} key={q}>
          <button className="fq-q" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
            {q}
            <span className="fq-i" />
          </button>
          {/* max-height is animated by the stylesheet; a generous cap keeps the
              transition smooth without measuring scrollHeight in JS */}
          <div className="fq-a" style={{ maxHeight: open === i ? "40em" : 0 }}>
            <p>{a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
