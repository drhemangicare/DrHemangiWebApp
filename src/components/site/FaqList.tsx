"use client";
import { useState } from "react";
import { faqsFor } from "@/lib/site/content";
import { useCare } from "./Care";

export function FaqList({ limit }: { limit?: number }) {
  const [open, setOpen] = useState<number | null>(null);
  /* Only the questions that are true in this mode. The list used to be the
     same eight questions in every state, seven of them describing an online
     booking flow that might not exist. */
  const { care } = useCare();
  const all = faqsFor(care.mode);
  const list = limit ? all.slice(0, limit) : all;
  return (
    <div className="faq rv">
      {list.map(({ q, a }, i) => (
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
