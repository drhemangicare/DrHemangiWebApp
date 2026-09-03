/**
 * Plain-language condition content.
 *
 * IMPORTANT — this is patient-facing medical information published under a
 * registered doctor's name. Everything here is drafted from standard,
 * widely-accepted clinical guidance and is deliberately conservative: no
 * outcome claims, no success rates, no promotional language. It must still be
 * read and signed off by Dr Hemangi before launch, and `reviewed` below flipped
 * to true with a date. Nothing here diagnoses; every page routes to a consult.
 */

export type Condition = {
  slug: string;
  name: string;
  short: string;            // nav / card label
  eyebrow: string;
  tagline: string;
  art: "ovary" | "endometriosis" | "fibroids" | "cycle" | "fertility" | "shield";
  intro: string[];
  howCommon: string;
  symptoms: string[];
  redFlags: string[];
  tests: { name: string; why: string }[];
  treatments: { tier: string; what: string; note: string }[];
  myths: { myth: string; truth: string }[];
  bookLabel: string;
  bookService?: string;     // ?service= slug for the booking deep link
};

export const REVIEW = {
  reviewed: false,
  reviewer: "Dr Hemangi — MBBS, DNB (Obs & Gynae), D.G.O, FMAS",
  reviewedOn: "",           // e.g. "12 August 2026" — fill in on sign-off
};

export const CONDITIONS: Condition[] = [
  /* ────────────────────────────────────────────────────────────── PCOS ── */
  {
    slug: "pcos",
    name: "PCOS (Polycystic Ovary Syndrome)",
    short: "PCOS",
    eyebrow: "Hormones & cycles",
    tagline: "The most common hormonal condition in women of reproductive age — and the most misunderstood.",
    art: "ovary",
    intro: [
      "PCOS is a hormonal condition, not a disease of the ovaries alone. The ovaries produce a little more androgen (a hormone everyone has, in different amounts) than usual, and ovulation becomes irregular or stops altogether. That single change explains most of what you notice: unpredictable periods, acne, unwanted hair, and difficulty conceiving.",
      "The name is misleading. The \"cysts\" seen on a scan are not cysts in the way most people imagine — they are small, immature follicles that started to develop and paused. They do not need to be drained or removed. You can also have PCOS with completely normal-looking ovaries on ultrasound.",
    ],
    howCommon:
      "Estimates vary widely depending on the criteria used, but PCOS is generally reported to affect somewhere between roughly 1 in 10 and 1 in 5 women of reproductive age. Many go years without a name for it.",
    symptoms: [
      "Periods that are irregular, infrequent, or stop for months at a time",
      "Acne that persists past the teenage years, often along the jaw and chin",
      "Coarse hair growth on the face, chest, stomach or back",
      "Thinning hair at the crown of the scalp",
      "Weight gain, or difficulty losing weight despite real effort",
      "Darkened, velvety patches of skin at the neck, underarms or groin",
      "Difficulty conceiving, because ovulation is unpredictable",
      "Mood changes, low energy, disturbed sleep",
    ],
    redFlags: [
      "No period for three months or more when you are not pregnant",
      "Very heavy bleeding after a long gap between periods",
      "Rapid hair growth or voice deepening over a short period",
      "A new diagnosis of high blood sugar or blood pressure alongside these symptoms",
    ],
    tests: [
      { name: "A proper cycle history", why: "The single most useful diagnostic tool. How long, how often, how predictable — this frequently tells more than any blood test." },
      { name: "Androgen levels", why: "Total and free testosterone to see whether raised androgens are driving the acne and hair changes." },
      { name: "Thyroid function and prolactin", why: "Both can produce PCOS-like irregular cycles and must be excluded before PCOS is diagnosed." },
      { name: "Blood sugar and insulin", why: "Fasting glucose, HbA1c or an insulin-resistance assessment. Insulin resistance is common in PCOS and changes how it is treated." },
      { name: "Lipid profile", why: "PCOS is associated with longer-term metabolic risk, so a baseline matters." },
      { name: "Pelvic ultrasound", why: "Looks at follicle count and ovarian volume. Helpful, but never sufficient on its own — a scan alone does not diagnose PCOS." },
      { name: "AMH", why: "Sometimes used as an additional marker, and relevant if you are thinking about fertility." },
    ],
    treatments: [
      { tier: "First — what moves the needle most", what: "Targeted changes to diet, movement, sleep and insulin resistance.", note: "Where there is excess weight, even a modest reduction can restore ovulation on its own. This is not a lecture about willpower; it is a plan built around insulin, not calories." },
      { tier: "Cycle regulation", what: "Combined hormonal contraception, or cyclical progesterone.", note: "Regulates bleeding, protects the lining of the uterus over the long term, and improves acne and hair symptoms. Chosen only if you are not currently trying to conceive." },
      { tier: "Insulin resistance", what: "Metformin, alongside the lifestyle plan.", note: "Used where insulin resistance is demonstrated, not reflexively for everyone." },
      { tier: "Skin and hair", what: "Anti-androgen medication, topical treatment, and dermatological options.", note: "These take months, not weeks. Expectations are set honestly at the start." },
      { tier: "When you are trying to conceive", what: "Ovulation induction — commonly letrozole — with follicular monitoring.", note: "Most women with PCOS ovulate and conceive with straightforward induction. IVF is not the starting point." },
      { tier: "Selected surgical cases", what: "Laparoscopic ovarian drilling.", note: "Reserved for specific situations where medication has not produced ovulation, and discussed carefully before it is offered." },
    ],
    myths: [
      { myth: "The cysts need to be surgically removed.", truth: "They are immature follicles, not surgical cysts. Removing them is not the treatment and can damage ovarian reserve." },
      { myth: "PCOS means you cannot get pregnant.", truth: "PCOS makes ovulation unpredictable, not impossible. Many women conceive naturally, and many more with simple ovulation induction." },
      { myth: "It only happens if you are overweight.", truth: "Lean PCOS is well recognised. Weight influences severity for some women; it is not the cause." },
      { myth: "It goes away after you have a baby.", truth: "PCOS is a long-term condition. Symptoms shift over the years, and it stays worth managing well past the years you are planning a family." },
    ],
    bookLabel: "Book a PCOS consultation",
  },

  /* ─────────────────────────────────────────────────── ENDOMETRIOSIS ── */
  {
    slug: "endometriosis",
    name: "Endometriosis",
    short: "Endometriosis",
    eyebrow: "Pain & inflammation",
    tagline: "Period pain that stops your life is not something to be endured. It is something to be investigated.",
    art: "endometriosis",
    intro: [
      "In endometriosis, tissue similar to the lining of the uterus grows where it should not — on the ovaries, the fallopian tubes, the lining of the pelvis, and sometimes the bowel or bladder. That tissue still responds to your monthly hormones. It thickens and bleeds like the lining does, but it has nowhere to drain.",
      "The result is inflammation, and over time scar tissue that can bind organs together. This is why the pain is often out of proportion to what a scan shows, and why it is so frequently dismissed. Women wait years, on average, for a diagnosis. The single most important thing to know is that severe period pain is common — but it is not normal.",
    ],
    howCommon: "Endometriosis is commonly reported to affect around 1 in 10 women of reproductive age. Delays of several years between the first symptom and a diagnosis are well documented worldwide.",
    symptoms: [
      "Period pain severe enough to keep you from work, college or ordinary activity",
      "Pain during or after sex, often felt deep rather than at the entrance",
      "Pain when opening your bowels or passing urine, typically worse around your period",
      "Pelvic pain between periods, or a constant background ache",
      "Heavy bleeding, or bleeding between periods",
      "Deep fatigue that arrives with the cycle",
      "Difficulty conceiving — sometimes the first sign in women with little pain",
    ],
    redFlags: [
      "Pain that painkillers no longer control",
      "Pain with bleeding from the bowel or in the urine around your period",
      "Sudden severe pelvic pain, which needs urgent assessment",
      "Not conceiving after a year of trying, alongside painful periods",
    ],
    tests: [
      { name: "A careful history of pain and timing", why: "Where the pain is, when in the cycle it arrives, and what it stops you doing. This is genuinely the most important part of the assessment." },
      { name: "Pelvic examination", why: "Can identify tenderness, nodules and restricted movement of the pelvic organs." },
      { name: "Transvaginal ultrasound", why: "Detects endometriomas on the ovaries and signs of deeper disease. A normal scan does not rule endometriosis out." },
      { name: "MRI", why: "Used where deep infiltrating disease involving the bowel or bladder is suspected, and to map before surgery." },
      { name: "Diagnostic laparoscopy", why: "The definitive way to see and confirm disease — and, in trained hands, to treat it in the same operation." },
    ],
    treatments: [
      { tier: "Pain control", what: "Anti-inflammatory medication used correctly, started before the pain peaks.", note: "Timing matters far more than dose. Most people take these too late in the cycle for them to work properly." },
      { tier: "Hormonal suppression", what: "Continuous combined pill, progestogens, or a hormonal intrauterine system.", note: "The aim is to quieten the cycle so the deposits are not stimulated each month. Often the first-line approach where fertility is not immediately planned." },
      { tier: "Advanced medical therapy", what: "GnRH analogues with add-back therapy.", note: "Used for a defined period in more severe disease, usually alongside a surgical plan." },
      { tier: "Surgery", what: "Laparoscopic excision or ablation of deposits and division of adhesions.", note: "Dr Hemangi is an FMAS-certified minimal access surgeon, so diagnosis and treatment can happen in one operation rather than being referred onward." },
      { tier: "Fertility", what: "A fertility plan built around the stage and site of disease.", note: "Endometriosis affects fertility in several different ways. The right next step depends on which one applies to you." },
    ],
    myths: [
      { myth: "Bad period pain is just part of being a woman.", truth: "Pain that stops you functioning is a symptom, not a personality test. It deserves investigation." },
      { myth: "A normal ultrasound means you do not have it.", truth: "Ultrasound misses a great deal of endometriosis, especially superficial disease. A normal scan with typical symptoms means keep looking, not stop looking." },
      { myth: "Getting pregnant cures endometriosis.", truth: "Symptoms often quieten during pregnancy because the cycle pauses, but the disease is still there afterwards." },
      { myth: "A hysterectomy always fixes it.", truth: "Endometriosis grows outside the uterus. Removing the uterus alone can leave the disease — and the pain — behind." },
    ],
    bookLabel: "Book a consultation about pelvic pain",
  },

  /* ──────────────────────────────────────────────────────── FIBROIDS ── */
  {
    slug: "fibroids",
    name: "Uterine fibroids",
    short: "Fibroids",
    eyebrow: "Bleeding & pressure",
    tagline: "Extremely common, almost always benign — and only worth treating when they are actually causing you trouble.",
    art: "fibroids",
    intro: [
      "Fibroids are growths of the muscular wall of the uterus. They are not cancer, and the overwhelming majority never become cancer. Many women have them and never know.",
      "What matters is not that a fibroid exists, but where it sits and how big it is. A small fibroid pressing into the cavity of the uterus can cause heavy bleeding and fertility problems, while a much larger one on the outer surface may cause nothing at all. That is why the plan depends on position, not just size on a report.",
    ],
    howCommon: "Fibroids are very common and become more so with age — a substantial proportion of women develop at least one by their late forties. Most cause no symptoms whatsoever.",
    symptoms: [
      "Heavy periods, flooding, or passing large clots",
      "Periods that last longer than they used to",
      "Tiredness, breathlessness or pallor from iron deficiency caused by the bleeding",
      "A feeling of pressure, heaviness or bloating low in the abdomen",
      "Needing to pass urine frequently, or difficulty emptying the bladder",
      "Constipation or discomfort opening the bowels",
      "Pain during sex, depending on the fibroid's position",
      "Difficulty conceiving, or repeated pregnancy loss, with certain positions",
    ],
    redFlags: [
      "Soaking through a pad or tampon every hour for several hours",
      "Bleeding heavily enough to cause dizziness or breathlessness",
      "Rapid increase in abdominal size",
      "Any bleeding after menopause",
    ],
    tests: [
      { name: "Pelvic examination", why: "Gives an immediate sense of the size and mobility of the uterus." },
      { name: "Transvaginal ultrasound", why: "The main tool — maps how many fibroids there are, how big, and crucially where each one sits." },
      { name: "Saline infusion sonography or hysteroscopy", why: "Used when a fibroid may be pushing into the cavity, which is the position that most affects bleeding and fertility." },
      { name: "MRI", why: "For detailed mapping before surgery, particularly with multiple or large fibroids." },
      { name: "Haemoglobin and ferritin", why: "Heavy bleeding causes iron deficiency long before it causes anaemia. Both are worth knowing and both are treatable." },
    ],
    treatments: [
      { tier: "Watchful waiting", what: "No treatment, with a review.", note: "Entirely appropriate for fibroids that are not causing symptoms. Not every finding on a scan needs an intervention." },
      { tier: "Managing the bleeding", what: "Tranexamic acid, anti-inflammatories, or a hormonal intrauterine system.", note: "Often enough on its own, and always worth trying before surgery where the main problem is bleeding." },
      { tier: "Shrinking before surgery", what: "GnRH analogues for a defined period.", note: "Used to reduce size and correct anaemia before an operation, not as a long-term solution." },
      { tier: "Hysteroscopic resection", what: "Removal through the cervix, with no cuts on the abdomen.", note: "The right operation for fibroids sitting inside the cavity. Day-case, quick recovery." },
      { tier: "Laparoscopic myomectomy", what: "Keyhole removal of fibroids with the uterus left in place.", note: "Preserves the uterus and fertility. This is minimal access surgery done in-house rather than referred out." },
      { tier: "Hysterectomy", what: "Removal of the uterus.", note: "A definitive option, considered only where symptoms are severe, the family is complete, and uterus-preserving options have been properly discussed first." },
    ],
    myths: [
      { myth: "Fibroids are a form of cancer.", truth: "They are benign growths of muscle tissue. Cancerous change is rare, and your doctor will tell you if any feature needs a closer look." },
      { myth: "Every fibroid has to come out.", truth: "Fibroids are treated when they cause symptoms or affect fertility. A fibroid that is doing nothing usually needs nothing." },
      { myth: "Fibroids always mean a hysterectomy.", truth: "Most women have uterus-preserving options, including keyhole removal." },
      { myth: "They will definitely stop you getting pregnant.", truth: "It depends entirely on position. Many women with fibroids conceive and carry without difficulty." },
    ],
    bookLabel: "Book a consultation about heavy periods",
  },

  /* ────────────────────────────────────────────── IRREGULAR PERIODS ── */
  {
    slug: "irregular-periods",
    name: "Irregular periods",
    short: "Irregular periods",
    eyebrow: "Hormones & cycles",
    tagline: "A symptom, never a diagnosis. The useful question is always: irregular because of what?",
    art: "cycle",
    intro: [
      "A typical cycle runs somewhere between 21 and 35 days, and for most women the length is reasonably predictable from month to month. Cycles shorter than 21 days, longer than 35, varying by more than about a week each month, or disappearing for months at a time all count as irregular.",
      "Irregular periods are not a diagnosis in themselves — they are the visible sign of something upstream. The whole job of the consultation is finding which cause applies to you, because the treatment for a thyroid problem looks nothing like the treatment for PCOS.",
    ],
    howCommon: "Occasional variation is normal, particularly in the first years after periods start and in the years approaching menopause. Persistent irregularity outside those windows is worth investigating.",
    symptoms: [
      "Cycles consistently shorter than 21 days or longer than 35",
      "Cycle length that swings by more than a week from month to month",
      "Periods that stop for three months or more without pregnancy",
      "Bleeding or spotting between periods",
      "Bleeding after sex",
      "Periods that suddenly become much heavier or much lighter than your normal",
    ],
    redFlags: [
      "Bleeding between periods or after sex",
      "Any bleeding after menopause",
      "Periods stopping for three months or more when you are not pregnant",
      "Irregular cycles with milky nipple discharge, or with severe headaches or vision changes",
    ],
    tests: [
      { name: "A pregnancy test", why: "Always first. It is the most common single explanation for a missed period and everything else follows from ruling it out." },
      { name: "Thyroid function", why: "Both an underactive and an overactive thyroid disturb the cycle, and both are straightforward to correct." },
      { name: "Prolactin", why: "Raised prolactin is an important and treatable cause of absent or irregular periods." },
      { name: "FSH, LH and oestradiol", why: "Assesses how the ovaries and the signals driving them are working, and helps identify the perimenopause." },
      { name: "Androgens", why: "Looks for the hormonal picture of PCOS." },
      { name: "Pelvic ultrasound", why: "Identifies structural causes — polyps, fibroids in the cavity, or the follicle pattern of PCOS." },
    ],
    treatments: [
      { tier: "Treat the cause, not the symptom", what: "Correct the thyroid, address raised prolactin, manage PCOS, remove a polyp.", note: "In most cases the cycle settles once the underlying reason is dealt with. Regulating the bleed while ignoring the cause is rarely the right first move." },
      { tier: "Where lifestyle is driving it", what: "Addressing significant weight change, very high training loads, disordered eating or sustained stress.", note: "The body switches ovulation off when it reads the environment as unsafe. This is handled without judgement, and often with input from a dietitian." },
      { tier: "Cycle regulation", what: "Cyclical progesterone or combined hormonal contraception.", note: "Used to give predictable bleeding and to protect the lining of the uterus where periods are very infrequent." },
      { tier: "If you are trying to conceive", what: "Ovulation tracking, and ovulation induction if you are not ovulating.", note: "Irregular cycles make timing hard. Confirming whether you are ovulating at all changes the plan completely." },
    ],
    myths: [
      { myth: "Going on the pill fixes irregular periods.", truth: "The pill creates a predictable withdrawal bleed. It manages the symptom, which is sometimes exactly right — but it does not treat what is causing it." },
      { myth: "Irregular periods always mean PCOS.", truth: "PCOS is one common cause among several. Thyroid disease, prolactin, weight change and perimenopause all produce the same picture." },
      { myth: "If your period is irregular you cannot get pregnant.", truth: "Irregular ovulation is unpredictable, not absent. Contraception is still needed if you do not want to conceive." },
    ],
    bookLabel: "Book a cycle consultation",
  },

  /* ─────────────────────────────────────────────────────── FERTILITY ── */
  {
    slug: "difficulty-conceiving",
    name: "Difficulty conceiving",
    short: "Trouble conceiving",
    eyebrow: "Fertility",
    tagline: "Two people, one investigation. Half of what we find is on the male side, and it is the easiest thing to test.",
    art: "fertility",
    intro: [
      "Doctors generally start investigating after twelve months of regular unprotected sex without conception — or after six months if you are over 35, because time matters more then. If you already know something relevant, such as very irregular cycles, severe period pain, or previous pelvic surgery, there is no reason to wait out the clock.",
      "The most important principle is that this is an investigation of a couple, not of a woman. A semen analysis is simple, quick and non-invasive, and male factors contribute in roughly half of all cases. Starting anywhere else wastes months.",
    ],
    howCommon: "Difficulty conceiving affects a substantial minority of couples. Ovulation problems, tubal factors, male factors and endometriosis account for most identifiable causes, and in a meaningful proportion no single cause is found.",
    symptoms: [
      "Twelve months of regular unprotected sex without conception — or six months if you are 35 or older",
      "Very irregular or absent periods, which make ovulation unpredictable",
      "Severe period pain or pain with sex, which may point to endometriosis",
      "Previous pelvic infection, ectopic pregnancy or pelvic surgery",
      "Two or more pregnancy losses",
      "Known problems on a previous semen analysis",
    ],
    redFlags: [
      "You are 35 or older and have been trying for six months",
      "Periods have stopped entirely",
      "Known tubal disease, previous ectopic pregnancy, or previous pelvic infection",
      "Testicular surgery, injury, undescended testis or previous chemotherapy in the male partner",
    ],
    tests: [
      { name: "Semen analysis", why: "First, always. It is quick, non-invasive and inexpensive, and it changes the entire plan when abnormal. Repeated if the first result is unexpected." },
      { name: "Confirming ovulation", why: "Cycle history, mid-luteal progesterone, and follicular tracking on ultrasound where needed." },
      { name: "Ovarian reserve — AMH and antral follicle count", why: "Indicates how many eggs remain, which informs timing and which treatments are realistic. It does not measure egg quality." },
      { name: "Thyroid function and prolactin", why: "Both affect ovulation and both are simple to correct." },
      { name: "Tubal assessment — HSG or HyCoSy", why: "Checks whether the fallopian tubes are open. There is little point inducing ovulation if the path is blocked." },
      { name: "Pelvic ultrasound", why: "Assesses the uterus, the lining and the ovaries, and identifies fibroids, polyps or endometriomas." },
      { name: "Diagnostic laparoscopy", why: "Where endometriosis or adhesions are suspected — and treatable in the same operation." },
    ],
    treatments: [
      { tier: "Timing and tracking", what: "Understanding your own fertile window, with follicular monitoring where cycles are unpredictable.", note: "A surprising number of couples are simply mistiming. This costs nothing and is always step one." },
      { tier: "Ovulation induction", what: "Letrozole or clomiphene, with ultrasound monitoring.", note: "For women who are not ovulating reliably. Monitoring matters — it is what keeps the response safe and measurable." },
      { tier: "Surgery where there is something to correct", what: "Laparoscopy or hysteroscopy for endometriosis, adhesions, polyps or cavity fibroids.", note: "Done in-house as minimal access surgery. Correcting the structural problem sometimes removes the need for anything further." },
      { tier: "IUI", what: "Intrauterine insemination, with or without ovulation induction.", note: "Appropriate for specific situations, particularly mild male factor and unexplained infertility, and only where the tubes are open." },
      { tier: "IVF and ICSI", what: "A full IVF cycle, with ICSI where the male factor requires it.", note: "The right answer for some couples and the wrong first answer for many. You will be told plainly which group you are in, and roughly what it will cost, before you commit." },
    ],
    myths: [
      { myth: "It is usually a problem with the woman.", truth: "Male factors contribute in roughly half of cases, and the test is far simpler. Investigating only one partner is how couples lose a year." },
      { myth: "Just relax and it will happen.", truth: "Stress is real and worth addressing, but it is not a diagnosis and this advice delays people who have a findable, treatable cause." },
      { myth: "IVF is the answer to infertility.", truth: "IVF is one treatment among several. Many couples conceive with ovulation induction, surgery, or corrected timing." },
      { myth: "A normal AMH means everything is fine.", truth: "AMH estimates quantity, not quality, and says nothing about the tubes, the uterus or the sperm." },
    ],
    bookLabel: "Book a fertility mapping consult",
    bookService: "fertility",
  },

  /* ────────────────────────────────────────── RECURRENT MISCARRIAGE ── */
  {
    slug: "recurrent-miscarriage",
    name: "Recurrent miscarriage",
    short: "Recurrent miscarriage",
    eyebrow: "Pregnancy loss",
    tagline: "It is not something you caused. And in most couples, investigation finds either a treatable reason or a genuinely reassuring answer.",
    art: "shield",
    intro: [
      "Miscarriage is far more common than most people realise — a substantial proportion of recognised pregnancies end this way, most in the first twelve weeks, and most because of a chromosomal error in that particular pregnancy that nobody could have prevented.",
      "Recurrent loss means two or more consecutive miscarriages. Historically women were told to wait for three before anyone would investigate; increasingly, investigation is offered after two, because the tests are straightforward and the waiting is cruel. The most important thing to say plainly: this is not caused by lifting something, working too hard, an argument, or anything you ate.",
    ],
    howCommon: "Around one in four to five recognised pregnancies ends in miscarriage. Recurrent loss — two or more in a row — affects a much smaller group, and the majority of those couples go on to have a successful pregnancy.",
    symptoms: [
      "Two or more consecutive pregnancy losses",
      "Losses occurring at a similar stage each time",
      "A loss in the second trimester, which is investigated differently",
      "Painless dilatation of the cervix in a previous mid-pregnancy loss",
      "A known clotting disorder, thyroid condition or diabetes",
    ],
    redFlags: [
      "Heavy bleeding with clots and severe pain in early pregnancy — seek urgent care",
      "Severe one-sided pain with a positive pregnancy test, which needs immediate assessment for ectopic pregnancy",
      "Fever alongside bleeding in pregnancy",
      "A second-trimester loss, which should always be investigated",
    ],
    tests: [
      { name: "Antiphospholipid antibodies", why: "Lupus anticoagulant and anticardiolipin antibodies. This is one of the few genuinely treatable causes of recurrent loss, which is why it is checked early." },
      { name: "Thyroid function and thyroid antibodies", why: "Thyroid disease affects both conception and the maintenance of a pregnancy, and correcting it is simple." },
      { name: "Blood sugar control", why: "Poorly controlled diabetes increases the risk of loss. Optimising it before the next pregnancy matters." },
      { name: "Assessment of the shape of the uterus", why: "Pelvic ultrasound, 3D imaging or hysteroscopy. A uterine septum is a structural cause that can be surgically corrected." },
      { name: "Parental karyotype, in selected couples", why: "A balanced chromosomal rearrangement in one partner is uncommon but important to identify, as it changes the counselling entirely." },
      { name: "Testing of the pregnancy tissue, where possible", why: "Confirming a chromosomal cause for a particular loss can spare you a long list of other investigations." },
    ],
    treatments: [
      { tier: "Treating what is found", what: "Aspirin and heparin for antiphospholipid syndrome; thyroid correction; blood sugar optimisation.", note: "Where a treatable cause is identified, treating it meaningfully changes the outlook for the next pregnancy." },
      { tier: "Surgical correction", what: "Hysteroscopic resection of a uterine septum, or removal of a fibroid or polyp distorting the cavity.", note: "Done as minimal access surgery where the anatomy is the identified problem." },
      { tier: "Cervical support", what: "Monitoring of cervical length, and a cervical stitch in selected cases.", note: "Specifically for mid-pregnancy losses with a painless, shortening cervix." },
      { tier: "Progesterone support", what: "Progesterone in early pregnancy for a defined group.", note: "Offered based on your particular history rather than to everyone. You will be told honestly what the evidence does and does not show." },
      { tier: "Close early pregnancy care", what: "Early scans, direct access, and someone who answers.", note: "When no cause is found — which is common — supportive early care with frequent reassurance is itself associated with good outcomes, and it makes the waiting survivable." },
    ],
    myths: [
      { myth: "You must have done something to cause it.", truth: "Everyday activity, work, exercise, stress and ordinary food do not cause miscarriage. The commonest cause is a chromosomal error in that pregnancy, present from the beginning." },
      { myth: "Nothing can be done until you have had three.", truth: "Investigation after two consecutive losses is increasingly standard, and the initial tests are simple." },
      { myth: "No cause found means no hope.", truth: "Unexplained recurrent loss carries a genuinely reasonable chance of a successful next pregnancy, particularly with supportive early care." },
      { myth: "Complete bed rest prevents miscarriage.", truth: "Bed rest has not been shown to prevent miscarriage, and prolonged immobility carries its own risks." },
    ],
    bookLabel: "Book a consultation about pregnancy loss",
    bookService: "fertility",
  },
];

export const conditionBySlug = (slug: string) => CONDITIONS.find((c) => c.slug === slug);
