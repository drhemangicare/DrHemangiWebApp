/**
 * What kinds of consultation the clinic is offering, and every sentence that
 * depends on the answer.
 *
 * ── WHY THIS FILE EXISTS ──────────────────────────────────────────────────
 * There are two switches in Admin → Settings:
 *
 *   online_consultation_enabled  — video consultations, bookable on this site
 *   clinic_visit_enabled         — in-person visits at the clinic
 *
 * Until now only the *interactive* parts of the site respected them. Buttons
 * disappeared, /book redirected, the APIs returned 403 — and the site went on
 * saying "Every consultation is 25–40 minutes", "private consultations on
 * video or in clinic", "How does the video consultation work?" and offering a
 * FAQ made almost entirely of questions about a booking flow that no longer
 * existed. Hiding a button does not un-promise the thing the button did.
 *
 * So the flags are resolved once into a `Care` value with a four-way `mode`,
 * and every piece of copy that makes a promise about being seen is looked up
 * from CARE_COPY by that mode. Adding a fifth surface means adding a field
 * here with four written variants — which is the point: it is not possible to
 * add flag-dependent copy and forget one of the states.
 *
 * ── WHY THE COPY IS DATA AND NOT FOUR TERNARIES AT THE CALL SITE ──────────
 * Because the states are not "on" and "off with a generic apology". A clinic
 * that sees people in person but not on video is a completely normal clinic
 * and should read like one, not like a broken website. Each mode gets real
 * sentences written for it.
 *
 * This module is deliberately free of server imports so client components
 * (Nav, Hero, FaqList, ChapterScroller) can read the same table the server
 * renders from.
 */

export type CareMode =
  /** Video consultations AND in-person visits. */
  | "both"
  /** Video consultations only — no in-person visits at the moment. */
  | "online"
  /** In-person visits only — nothing is bookable on this site. */
  | "clinic"
  /** Neither. The site is a women's-health resource and a way to reach the clinic. */
  | "none";

export type Care = {
  /** Video consultations are offered (and, on this site, bookable). */
  online: boolean;
  /** In-person clinic visits are offered. */
  clinic: boolean;
  mode: CareMode;
  /** Any form of consultation at all. */
  any: boolean;
  /**
   * Can a patient reserve a slot on this website?
   *
   * Identical to `online` today and that is not a coincidence: the booking
   * engine only ever sold video consultations — in-clinic visits have always
   * been arranged by phone. It is a separate field because the two ideas are
   * separate, and a reader at a call site is asking one or the other.
   */
  booking: boolean;
};

export function careFrom(online: boolean, clinic: boolean): Care {
  const mode: CareMode = online ? (clinic ? "both" : "online") : clinic ? "clinic" : "none";
  return { online, clinic, mode, any: online || clinic, booking: online };
}

/**
 * The value used before the real one is known, and if anything goes wrong.
 *
 * Fail-closed, and deliberately the opposite of the `true` database fallback
 * in settings.ts. Those two answer different questions. A server that cannot
 * reach the database should keep a working clinic working. A *client* that has
 * not been told the flag is in that state precisely because it is rendering
 * outside the provider — which is how booking buttons once appeared on a 404
 * while booking was switched off. Rendering one round of "contact the clinic"
 * on a site that does take bookings is a cosmetic miss; rendering "book now"
 * on a clinic that has closed its books sends someone to a dead end.
 */
export const CARE_CLOSED: Care = careFrom(false, false);

export type Cta = { href: string; label: string };

export type CareStep = [title: string, body: string];

export type CareCopy = {
  /* ── hero ── */
  heroLede: string;
  heroPrimary: Cta;
  heroSecondary: Cta;

  /* ── chrome ── */
  navCta: string;
  navServicesDesc: string;
  navFaqDesc: string;
  /** Clinic-menu entry. Only says "directions" where there is somewhere to go. */
  navContactLabel: string;
  /** Second line of the mobile drawer footer. Never the same as the first. */
  mobileSecondary: Cta;
  footerEmergencyLede: string;

  /* ── services ── */
  servicesLede: string;

  /* ── the "how this works" band ── */
  process: { eyebrow: string; title: [string, string]; lede: string; steps: CareStep[] };

  /* ── fertility spotlight ── */
  fertilityConsult: string;
  fertilityStat: [big: string, caption: string];
  fertilityCta: Cta;

  /* ── chapter three of the home scroller ── */
  chapterThreeTitle: string;
  chapterThreeLede: string;
  chapterThreeItem: string;

  /* ── closing band on each trimester page ── */
  antenatalBand: { eyebrow: string; heading: string; body: string };

  /* ── closing band ── */
  band: { eyebrow: string; body: string; primary: Cta; secondary: Cta };

  /* ── clinic block (only rendered when `clinic` is true) ── */
  clinicLede: string;
  /** Fourth tile of the clinic card — replaces the "book online instead" note. */
  clinicAside: [title: string, body: string];

  /* ── contact page ── */
  contactTitle: string;
  contactMetaDescription: string;
  contactLede: string;

  /* ── condition & trimester pages ── */
  conditionCta: string;

  /* ── metadata ── */
  siteDescription: string;
};

/**
 * `{email}` is substituted at render time with the clinic's support address so
 * the table stays a plain, testable string map.
 */
export const CARE_EMAIL_TOKEN = "{email}";

export const CARE_COPY: Record<CareMode, CareCopy> = {
  /* ─────────────────────────── video + in person ─────────────────────────── */
  both: {
    heroLede:
      "From the first question you were too shy to ask, through fertility, pregnancy and postpartum — private consultations with Dr Hemangi, on video or in clinic. No account. No waiting room.",
    heroPrimary: { href: "/book", label: "Book a consultation" },
    heroSecondary: { href: "/bookings", label: "My bookings" },

    navCta: "Book consultation",
    navServicesDesc: "Consultations, surgery, antenatal care",
    navFaqDesc: "Fees, timings, how consultations work",
    navContactLabel: "Contact & directions",
    mobileSecondary: { href: "/contact", label: "Contact the clinic" },
    footerEmergencyLede:
      "This site is for scheduled consultations only. For bleeding, severe pain or labour, go to your nearest emergency department immediately.",

    servicesLede:
      "Every consultation is 25–40 minutes. Long enough to actually explain the why, not just hand over a prescription.",

    process: {
      eyebrow: "Booking, simplified",
      title: ["Four taps. No password.", "No forms you'll abandon."],
      lede: "We deliberately did not build a login. Your email is your account — that's it.",
      steps: [
        ["Pick a time that suits you", "A private video consultation on Google Meet, with live availability for the next 21 days."],
        ["Choose your slot", "Only genuinely free times are shown. Slots hold for 10 minutes while you complete the booking."],
        ["Pay securely", "UPI, cards, netbanking or wallets through Razorpay. Nothing is confirmed until payment succeeds."],
        ["Check your inbox", "Confirmation, calendar invite and Meet link arrive instantly — with reminders 24 hours and 1 hour before."],
      ],
    },

    fertilityConsult:
      "Every plan starts with a 40-minute mapping consult: your history, both partners' reports, and a written timeline of what happens next and roughly what it will cost.",
    fertilityStat: ["40 min", "Dedicated first fertility mapping consultation"],
    fertilityCta: { href: "/book?service=fertility", label: "Book fertility consult" },

    chapterThreeTitle: "Nine months of somebody actually picking up the phone",
    chapterThreeLede:
      'Structured antenatal care with the scans and screenings that matter, plus quick video check-ins between visits — because "is this normal?" shouldn\'t wait two weeks.',
    chapterThreeItem: "Between-visit video consults for the small worries",

    antenatalBand: {
      eyebrow: "Between appointments",
      heading: "“Is this normal?” shouldn’t wait two weeks.",
      body: "Antenatal care with quick video check-ins between visits, so the small worries get answered when you have them.",
    },

    band: {
      eyebrow: "Book in under two minutes",
      body: "Twenty-five unhurried minutes with a doctor who will actually explain what's happening.",
      primary: { href: "/book", label: "Book a consultation" },
      secondary: { href: "/bookings", label: "I already have a booking" },
    },

    clinicLede:
      "Online video consultations are booked instantly. In-clinic visits are arranged directly — here's where to find us.",
    clinicAside: ["Booking online?", "Only video consultations can be booked on this site."],

    contactTitle: "Contact & clinic visits",
    contactMetaDescription:
      "Clinic address, timings and phone number. Online video consultations can be booked instantly; in-clinic visits are arranged directly.",
    contactLede:
      "Video consultations are booked online in about two minutes. For an in-person visit, reach out directly.",

    conditionCta: "Book a consultation",

    siteDescription:
      "Book a private consultation with Dr Hemangi — MBBS, DNB, D.G.O, FMAS Laparoscopic Surgeon, Infertility Specialist (IUI & IVF). Video or in-clinic, no account needed.",
  },

  /* ─────────────────────────── video consultations only ──────────────────── */
  online: {
    heroLede:
      "From the first question you were too shy to ask, through fertility, pregnancy and postpartum — private video consultations with Dr Hemangi. No account. No waiting room.",
    heroPrimary: { href: "/book", label: "Book a consultation" },
    heroSecondary: { href: "/bookings", label: "My bookings" },

    navCta: "Book consultation",
    navServicesDesc: "Consultations, surgery, antenatal care",
    navFaqDesc: "Fees, privacy and how video consultations work",
    navContactLabel: "Contact the clinic",
    mobileSecondary: { href: "/contact", label: "Contact the clinic" },
    footerEmergencyLede:
      "This site is for scheduled video consultations only. For bleeding, severe pain or labour, go to your nearest emergency department immediately.",

    servicesLede:
      "Every consultation is 25–40 minutes. Long enough to actually explain the why, not just hand over a prescription.",

    process: {
      eyebrow: "Booking, simplified",
      title: ["Four taps. No password.", "No forms you'll abandon."],
      lede: "We deliberately did not build a login. Your email is your account — that's it.",
      steps: [
        ["Pick a time that suits you", "A private video consultation on Google Meet, with live availability for the next 21 days."],
        ["Choose your slot", "Only genuinely free times are shown. Slots hold for 10 minutes while you complete the booking."],
        ["Pay securely", "UPI, cards, netbanking or wallets through Razorpay. Nothing is confirmed until payment succeeds."],
        ["Check your inbox", "Confirmation, calendar invite and Meet link arrive instantly — with reminders 24 hours and 1 hour before."],
      ],
    },

    fertilityConsult:
      "Every plan starts with a 40-minute mapping consult: your history, both partners' reports, and a written timeline of what happens next and roughly what it will cost.",
    fertilityStat: ["40 min", "Dedicated first fertility mapping consultation"],
    fertilityCta: { href: "/book?service=fertility", label: "Book fertility consult" },

    chapterThreeTitle: "Nine months of somebody who actually answers",
    chapterThreeLede:
      'Structured antenatal care with the scans and screenings that matter, plus quick video check-ins between appointments — because "is this normal?" shouldn\'t wait two weeks.',
    chapterThreeItem: "Video check-ins between appointments, for the small worries",

    antenatalBand: {
      eyebrow: "Between appointments",
      heading: "“Is this normal?” shouldn’t wait two weeks.",
      body: "Antenatal care with quick video check-ins between appointments, so the small worries get answered when you have them.",
    },

    band: {
      eyebrow: "Book in under two minutes",
      body: "Twenty-five unhurried minutes with a doctor who will actually explain what's happening.",
      primary: { href: "/book", label: "Book a consultation" },
      secondary: { href: "/bookings", label: "I already have a booking" },
    },

    /* Not rendered while `clinic` is false — present so the record is total. */
    clinicLede:
      "Online video consultations are booked instantly. In-clinic visits are arranged directly — here's where to find us.",
    clinicAside: ["Booking online?", "Only video consultations can be booked on this site."],

    contactTitle: "Contact",
    contactMetaDescription:
      "How to reach Dr Hemangi's clinic by email. Online video consultations can be booked instantly, in about two minutes.",
    contactLede:
      "Video consultations are booked online in about two minutes. Anything else, email us and we'll come back to you.",

    conditionCta: "Book a consultation",

    siteDescription:
      "Book a private video consultation with Dr Hemangi — MBBS, DNB, D.G.O, FMAS Laparoscopic Surgeon, Infertility Specialist (IUI & IVF). No account needed.",
  },

  /* ─────────────────────────── in person only ────────────────────────────── */
  clinic: {
    heroLede:
      "From the first question you were too shy to ask, through fertility, pregnancy and postpartum — unhurried consultations with Dr Hemangi at the clinic. Call, and the team will find you a time.",
    heroPrimary: { href: "/contact", label: "Clinic & directions" },
    heroSecondary: { href: "/services", label: "What we treat" },

    navCta: "Clinic & directions",
    navServicesDesc: "Consultations, surgery, antenatal care",
    navFaqDesc: "Fees, timings, how a clinic visit works",
    navContactLabel: "Contact & directions",
    mobileSecondary: { href: "/services", label: "What we treat" },
    footerEmergencyLede:
      "This site is for information and clinic contact only. For bleeding, severe pain or labour, go to your nearest emergency department immediately.",

    servicesLede:
      "Every clinic consultation is 25–40 minutes. Long enough to actually explain the why, not just hand over a prescription.",

    process: {
      eyebrow: "Visiting the clinic",
      title: ["No forms, no portal.", "Just call and come in."],
      lede: "Appointments are arranged the old-fashioned way, by someone who can answer your questions while you're on the phone.",
      steps: [
        ["Call the clinic", "Tell the team roughly what's going on and how soon you need to be seen. They'll offer you the next sensible slot."],
        ["Bring what you already have", "Previous scans, blood reports, prescriptions and the dates of your last few cycles. Old records save a whole appointment."],
        ["Come in", `Consultations run 25–40 minutes. If something needs a scan, a procedure or surgery, Dr Hemangi will explain it and arrange it there and then.`],
      ],
    },

    fertilityConsult:
      "Every plan starts with a 40-minute mapping consultation at the clinic: your history, both partners' reports, and a written timeline of what happens next and roughly what it will cost.",
    fertilityStat: ["40 min", "Dedicated first fertility mapping consultation"],
    fertilityCta: { href: "/contact", label: "Ask about fertility care" },

    chapterThreeTitle: "Nine months of somebody actually picking up the phone",
    chapterThreeLede:
      'Structured antenatal care with the scans and screenings that matter, and a clinic that picks up the phone between appointments — because "is this normal?" shouldn\'t wait two weeks.',
    chapterThreeItem: "A phone that gets answered between appointments",

    antenatalBand: {
      eyebrow: "Between appointments",
      heading: "“Is this normal?” shouldn’t wait two weeks.",
      body: "Antenatal care from a clinic that answers the phone between appointments, so the small worries get answered when you have them.",
    },

    band: {
      eyebrow: "Come and see us",
      body: "Call the clinic and the team will find you a time — usually within the same week.",
      primary: { href: "/contact", label: "Clinic & directions" },
      secondary: { href: "/services", label: "What we treat" },
    },

    clinicLede: "Appointments at the clinic are arranged directly with the team — here's where to find us.",
    clinicAside: ["Prefer to write?", `Email ${CARE_EMAIL_TOKEN} and the team will call you back.`],

    contactTitle: "Contact & clinic visits",
    contactMetaDescription:
      "Clinic address, timings and phone number for Dr Hemangi's clinic. Appointments are arranged directly with the team.",
    contactLede:
      "Appointments are arranged over the phone — call and the team will find you a time. For anything else, email us and we'll come back to you.",

    conditionCta: "Ask about an appointment",

    siteDescription:
      "Dr Hemangi — MBBS, DNB, D.G.O, FMAS Laparoscopic Surgeon, Infertility Specialist (IUI & IVF). Unhurried gynaecology, fertility and antenatal care at the clinic.",
  },

  /* ─────────────────────────── neither ───────────────────────────────────── */
  none: {
    heroLede:
      "From the first question you were too shy to ask, through fertility, pregnancy and postpartum — Dr Hemangi's guides explain what's happening in your body, plainly and without scare tactics.",
    heroPrimary: { href: "/contact", label: "Contact the clinic" },
    heroSecondary: { href: "/services", label: "What we treat" },

    navCta: "Contact the clinic",
    navServicesDesc: "Everything Dr Hemangi treats",
    navFaqDesc: "Fees, records and how the clinic works",
    navContactLabel: "Contact the clinic",
    mobileSecondary: { href: "/services", label: "What we treat" },
    footerEmergencyLede:
      "This site is for information and clinic contact only. For bleeding, severe pain or labour, go to your nearest emergency department immediately.",

    servicesLede:
      "Unhurried, evidence-based gynaecology — from adolescence through fertility, pregnancy and menopause. Here's the full range of what Dr Hemangi treats.",

    process: {
      eyebrow: "Getting in touch",
      title: ["No portal, no forms.", "One inbox."],
      lede: "Appointments are not being scheduled at the moment. Write to the clinic and they will tell you what is currently possible.",
      steps: [
        ["Write to the clinic", `${CARE_EMAIL_TOKEN} — say roughly what is going on and how urgent it feels. That is enough to start with.`],
        ["A person replies", "Answers come from the clinic on working days, and will say what is possible now and, if Dr Hemangi cannot see you herself, who nearby can."],
        ["Read up in the meantime", "The condition guides and the week-by-week pregnancy journey here are written to be understood, not to sell you an appointment."],
      ],
    },

    fertilityConsult:
      "A fertility plan starts by mapping what's actually going on: your history, both partners' reports, and a written timeline of what happens next and roughly what it will cost.",
    /* NOT "Both" — the tile beside this one already reads "Both / Partners
       evaluated together", and the two sat side by side saying the same word. */
    fertilityStat: ["Mapped", "Your history and both partners' reports, read together"],
    fertilityCta: { href: "/conditions/difficulty-conceiving", label: "Difficulty conceiving, explained" },

    chapterThreeTitle: "Nine months of knowing what's normal, and what isn't",
    chapterThreeLede:
      'Structured antenatal care with the scans and screenings that matter, and clear guidance between appointments — because "is this normal?" shouldn\'t wait two weeks.',
    chapterThreeItem: "Plain answers to the small worries between appointments",

    antenatalBand: {
      eyebrow: "While you are waiting",
      heading: "Nobody should be guessing at 2am.",
      body: "These trimester guides cover what is normal week by week, and what needs looking at the same day. Anything in the second group should never wait on an inbox — go straight to your nearest maternity unit.",
    },

    band: {
      eyebrow: "Write to the clinic",
      body: "Send the clinic a line and the team will tell you what's possible at the moment.",
      primary: { href: "/contact", label: "Contact the clinic" },
      secondary: { href: "/conditions", label: "Read the condition guides" },
    },

    clinicLede: "Appointments at the clinic are arranged directly with the team — here's where to find us.",
    clinicAside: ["Prefer to write?", `Email ${CARE_EMAIL_TOKEN} and the team will call you back.`],

    contactTitle: "Contact",
    contactMetaDescription:
      "Where to email Dr Hemangi's clinic with questions about care, records and reports, and what to do in an emergency.",
    contactLede:
      "Appointments aren't being scheduled at the moment. Email is the way to reach the clinic — the team will tell you what's possible.",

    conditionCta: "Contact the clinic",

    siteDescription:
      "Dr Hemangi — MBBS, DNB, D.G.O, FMAS Laparoscopic Surgeon, Infertility Specialist (IUI & IVF). Clear, evidence-based guides to gynaecology, fertility and pregnancy.",
  },
};

/** Look up this mode's copy with `{email}` resolved. */
export function careCopy(care: Care, supportEmail: string): CareCopy {
  const raw = CARE_COPY[care.mode];
  if (!raw.clinicAside[1].includes(CARE_EMAIL_TOKEN) && !JSON.stringify(raw.process).includes(CARE_EMAIL_TOKEN)) {
    return raw;
  }
  const sub = (s: string) => s.split(CARE_EMAIL_TOKEN).join(supportEmail);
  return {
    ...raw,
    clinicAside: [raw.clinicAside[0], sub(raw.clinicAside[1])],
    process: {
      ...raw.process,
      steps: raw.process.steps.map(([t, b]) => [t, sub(b)] as CareStep),
    },
  };
}
