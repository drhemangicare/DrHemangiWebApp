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

export const FAQS: [string, string][] = [
  ["Do I need to create an account to book?",
   "No. You book with your name, phone number and email — that's it. To see your bookings later, enter the same email on the \"My bookings\" page and we'll send a one-time code to confirm it's you. Nothing to remember, nothing to reset."],
  ["How does the video consultation work?",
   "Once payment succeeds, a Google Meet link is generated for your exact slot and emailed to both you and Dr Hemangi, along with a calendar invite. You can join from a phone, tablet or laptop — no app installation, no downloads. The link also appears on your booking card here."],
  ["Is my information private?",
   "Your details are visible only to Dr Hemangi and are never shared, sold or used for marketing. Reports you upload are encrypted and attached solely to your consultation. You can request deletion of your records at any time by writing to the clinic."],
  ["Can I reschedule or cancel?",
   "Yes — free rescheduling up to 6 hours before your slot, directly from your booking card. Cancellations more than 24 hours ahead are refunded in full; within 24 hours, 50% is refunded. If Dr Hemangi ever has to cancel, you're refunded in full and offered priority rebooking."],
  ["Which payment methods are accepted?",
   "All payments run through Razorpay — UPI (GPay, PhonePe, Paytm), credit and debit cards, netbanking and wallets. The clinic never sees or stores your card details. A GST invoice is emailed with your confirmation."],
  ["Can I share my reports before the consultation?",
   "Please do. During booking you can upload scans, blood reports or prescriptions (PDF or images). Dr Hemangi reviews them before your slot, so the consultation starts with context instead of catch-up. You can also add reports afterwards from your booking card."],
  ["Will I get a prescription and notes?",
   "Yes. A digital prescription and consultation summary are emailed within a few hours of your appointment and stay available on your booking card. If Dr Hemangi adds follow-up instructions later, you'll get an email and it appears there too."],
  ["Is a video consult right for my problem?",
   "Video works well for cycle issues, PCOS, contraception, report reviews, fertility planning, follow-ups and most postpartum questions. Anything needing an internal examination, scan, procedure or surgery will need an in-clinic visit — if that's the case, Dr Hemangi will tell you during the video call and the fee is adjusted against your clinic visit."],
];
