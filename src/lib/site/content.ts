import type { CareMode } from "./care";

// Pure content/data with no server imports.
//
// This lives apart from sections.tsx on purpose: FaqList is a client component
// and imports FAQS, and sections.tsx imports the server-only settings module
// (which pulls in the service-role Supabase client). Importing one from the
// other dragged that server module into the browser bundle graph — Next.js
// refuses to build in that state, and rightly so.

export const SERVICES = [
  { id: "menstrual", icon: "i-lotus", pulse: false, h: "Menstrual & PCOS care",
    p: "Irregular, heavy or painful cycles, PCOS/PCOD, hormonal imbalance and thyroid-linked disruption — investigated properly and managed long-term.",
    tags: ["PCOS", "Endometriosis", "Hormones"] },
  { id: "fertility", icon: "i-heart", pulse: true, h: "Fertility & conception",
    p: "Pre-conception counselling, complete fertility workup for both partners, ovulation tracking, IUI and IVF pathways with honest expectations.",
    tags: ["IUI", "IVF", "Ovulation"] },
  { id: "pregnancy", icon: "i-baby", pulse: false, h: "Pregnancy & antenatal",
    p: "Trimester-wise antenatal care, growth and anomaly scan interpretation, high-risk pregnancy management, and a birth plan you understand.",
    tags: ["Antenatal", "High-risk", "Birth plan"] },
  { id: "surgery", icon: "i-micro", pulse: false, h: "Laparoscopic surgery",
    p: "FMAS-certified minimal access surgery — fibroids, ovarian cysts, endometriosis, adhesions and hysteroscopic procedures with faster recovery.",
    tags: ["Fibroids", "Cysts", "Hysteroscopy"] },
  { id: "postpartum", icon: "i-sun", pulse: false, h: "Postpartum & menopause",
    p: "Recovery after delivery, lactation and mood support, pelvic floor rehabilitation, perimenopause symptoms and bone-health planning.",
    tags: ["Postpartum", "Pelvic floor", "Menopause"] },
  { id: "screening", icon: "i-scan", pulse: false, h: "Preventive screening",
    p: "Pap smear and HPV screening, breast examination, cervical health, vaccination guidance and annual well-woman reviews.",
    tags: ["Pap · HPV", "Well-woman", "Vaccines"] },
];

/**
 * The FAQ, tagged by which consultation modes each question makes sense in.
 *
 * Seven of the original eight questions were about the online booking flow —
 * accounts, Razorpay, Meet links, rescheduling. They were rendered on /faq, in
 * the home-page teaser and in the FAQPage structured data regardless of the
 * feature flags, so a clinic with online consultations switched off published
 * a page explaining how to pay for one. Filtering alone would have left the
 * section nearly empty, so each mode has its own questions written for it.
 *
 * `modes` is explicit rather than derived so adding a question forces the
 * author to decide where it is true.
 */
export type Faq = { q: string; a: string; modes: CareMode[] };

const BOOKING: CareMode[] = ["both", "online"];
const NO_ONLINE: CareMode[] = ["clinic", "none"];
const ALL: CareMode[] = ["both", "online", "clinic", "none"];

export const FAQS: Faq[] = [
  /* ── online booking ─────────────────────────────────────────────────────── */
  { modes: BOOKING,
    q: "Do I need to create an account to book?",
    a: "No. You book with your name, phone number and email — that's it. To see your bookings later, enter the same email on the \"My bookings\" page and we'll send a one-time code to confirm it's you. Nothing to remember, nothing to reset." },
  { modes: BOOKING,
    q: "How does the video consultation work?",
    a: "Once payment succeeds, a Google Meet link is generated for your exact slot and emailed to both you and Dr Hemangi, along with a calendar invite. You can join from a phone, tablet or laptop — no app installation, no downloads. The link also appears on your booking card here." },
  { modes: BOOKING,
    q: "Can I reschedule or cancel?",
    a: "Yes — free rescheduling up to 6 hours before your slot, directly from your booking card. Cancellations more than 24 hours ahead are refunded in full; within 24 hours, 50% is refunded. If Dr Hemangi ever has to cancel, you're refunded in full and offered priority rebooking." },
  { modes: BOOKING,
    q: "Which payment methods are accepted?",
    a: "All payments run through Razorpay — UPI (GPay, PhonePe, Paytm), credit and debit cards, netbanking and wallets. The clinic never sees or stores your card details. A GST invoice is emailed with your confirmation." },
  { modes: BOOKING,
    q: "Can I share my reports before the consultation?",
    a: "Please do. During booking you can upload scans, blood reports or prescriptions (PDF or images). Dr Hemangi reviews them before your slot, so the consultation starts with context instead of catch-up. You can also add reports afterwards from your booking card." },
  { modes: BOOKING,
    q: "Will I get a prescription and notes?",
    a: "Yes. A digital prescription and consultation summary are emailed within a few hours of your appointment and stay available on your booking card. If Dr Hemangi adds follow-up instructions later, you'll get an email and it appears there too." },
  { modes: BOOKING,
    q: "Is a video consult right for my problem?",
    a: "Video works well for cycle issues, PCOS, contraception, report reviews, fertility planning, follow-ups and most postpartum questions. Anything needing an internal examination, scan, procedure or surgery will need an in-clinic visit — if that's the case, Dr Hemangi will tell you during the video call and the fee is adjusted against your clinic visit." },

  /* ── in-person visits ───────────────────────────────────────────────────── */
  { modes: ["clinic"],
    q: "How do I get an appointment?",
    a: "Call the clinic during opening hours and the team will offer you the next sensible slot — usually within the same week, sooner if what you describe needs it. There is nothing to book or pay for on this website." },
  { modes: ["clinic"],
    q: "What should I bring to my visit?",
    a: "Anything you already have: previous scans, blood reports, discharge summaries, current prescriptions, and the dates of your last two or three cycles. Old records regularly save a whole appointment's worth of repeat testing." },
  { modes: ["clinic"],
    q: "How long is a consultation?",
    a: "Between 25 and 40 minutes, and longer for a first fertility mapping appointment. The clinic deliberately books fewer people per session so that the time is real rather than nominal." },
  { modes: ["clinic"],
    q: "Will I get a prescription and notes?",
    a: "Yes. You leave with a written prescription, and a digital copy along with a summary of what was discussed is emailed to you afterwards. If Dr Hemangi adds follow-up instructions later, those are emailed too." },

  /* ── no consultations on offer ──────────────────────────────────────────── */
  { modes: ["none"],
    q: "Is Dr Hemangi taking appointments at the moment?",
    a: "Appointments are not being scheduled at the moment. Email the clinic and the team will tell you what is currently possible and, if Dr Hemangi cannot see you herself, point you to someone nearby who can." },
  { modes: ["none"],
    q: "What is this site for, then?",
    a: "The condition guides, the week-by-week pregnancy journey and the service pages are written to be read on their own — plain explanations of what is happening in your body, what is worth investigating and what is not. They are not a substitute for being examined, and they never have been." },

  /* ── everywhere ─────────────────────────────────────────────────────────── */
  { modes: BOOKING,
    q: "Is my information private?",
    a: "Your details are visible only to Dr Hemangi and are never shared, sold or used for marketing. Reports you upload are encrypted and attached solely to your consultation. You can request deletion of your records at any time by writing to the clinic." },
  { modes: NO_ONLINE,
    q: "Is my information private?",
    a: "Any records the clinic holds are visible only to Dr Hemangi and are never shared, sold or used for marketing. This website itself does not ask you for medical information. You can request a copy of your records, or their deletion, at any time by writing to the clinic." },
  { modes: NO_ONLINE,
    q: "How do I get a copy of an old prescription or report?",
    a: "Email the clinic from the address it already has for you, saying roughly when you were last seen. Records are released to the patient themselves, so you may be asked to confirm a detail before anything is sent." },
  { modes: ALL,
    q: "Can I get medical advice by email?",
    a: "No — and please don't rely on it. The inbox is for questions about the clinic, your records and anything on this website that looks wrong. It is read during working hours by the team, not around the clock by a doctor." },
  { modes: ALL,
    q: "What should I do in an emergency?",
    a: "Go to your nearest emergency department, immediately. Heavy bleeding, severe pain, reduced fetal movement, waters breaking or contractions five minutes apart are not things to email, message or wait on." },
];

/** The questions that are true in this mode, in the order written above. */
export function faqsFor(mode: CareMode): Faq[] {
  return FAQS.filter((f) => f.modes.includes(mode));
}
