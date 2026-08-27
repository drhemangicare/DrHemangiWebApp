/**
 * Week-by-week pregnancy content.
 *
 * Same standing rule as conditions.ts: drafted from standard antenatal
 * guidance, deliberately general, and pending Dr Hemangi's sign-off before
 * launch. Measurements are typical averages — real babies vary a great deal and
 * every page says so. Nothing here replaces the scans and checks in your own
 * antenatal plan.
 *
 * Weeks are counted from the first day of the last menstrual period, which is
 * how doctors date pregnancy. That is why weeks 1 and 2 happen before
 * conception — a genuinely confusing point that the early pages call out.
 */

export type Week = {
  w: number;
  size: string;        // everyday size comparison
  len: string;         // typical length
  wt: string;          // typical weight
  stage: FetalStage;   // which illustration archetype to draw
  baby: string;
  you: string;
  care: string;
};

export type FetalStage =
  | "preconception"
  | "blastocyst"
  | "embryo-early"
  | "embryo-late"
  | "fetus-early"
  | "fetus-mid"
  | "fetus-late"
  | "fetus-term";

export const TRIMESTERS = [
  { n: 1, label: "First trimester", weeks: [1, 13], blurb: "Everything is being built. You may feel dreadful, or nothing at all — both are normal." },
  { n: 2, label: "Second trimester", weeks: [14, 27], blurb: "Usually the kindest stretch. Sickness settles, energy returns, and you start to feel movement." },
  { n: 3, label: "Third trimester", weeks: [28, 40], blurb: "Growth and preparation — for the baby's lungs, and for you." },
];

export const trimesterOf = (w: number) => (w <= 13 ? 1 : w <= 27 ? 2 : 3);

export const WEEKS: Week[] = [
  { w: 1, size: "Not yet conceived", len: "—", wt: "—", stage: "preconception",
    baby: "You are not pregnant yet. Doctors date pregnancy from the first day of your last period, so weeks one and two are counted before conception has happened. It is the one reliable date most people can remember.",
    you: "This is your period. Nothing about it feels different, because nothing is different yet.",
    care: "If you are planning a pregnancy, start folic acid now — it works best in the weeks before conception and through the first trimester. Stop alcohol and smoking, and review any regular medication with a doctor." },
  { w: 2, size: "One egg", len: "0.1 mm", wt: "—", stage: "preconception",
    baby: "An egg is maturing inside a follicle in one ovary. Towards the end of this week, in a typical 28-day cycle, it will be released.",
    you: "You may notice clearer, stretchier discharge and a slight rise in temperature around ovulation. Some women feel a one-sided twinge.",
    care: "This is the fertile window. Continue folic acid. If cycles are irregular, ovulation may be earlier or later than the textbook day fourteen." },
  { w: 3, size: "A pinhead of cells", len: "0.1 mm", wt: "—", stage: "blastocyst",
    baby: "Fertilisation. A single cell divides again and again as it travels down the fallopian tube towards the uterus. The entire genetic blueprint — including whether this baby is a boy or a girl — is already set.",
    you: "Nothing noticeable. A few women have light spotting as the cluster of cells settles into the lining.",
    care: "Too early for a pregnancy test to be reliable. Keep taking folic acid and avoid alcohol." },
  { w: 4, size: "A poppy seed", len: "1 mm", wt: "<1 g", stage: "blastocyst",
    baby: "Implantation into the lining of the uterus. The cells split into two groups — one becomes your baby, the other becomes the placenta.",
    you: "Your period is due, or just missed. Some women feel tender breasts, mild cramping, or nothing whatsoever.",
    care: "A home pregnancy test is likely to be accurate now. If it is positive, book a first appointment — early dating matters more than most people expect." },
  { w: 5, size: "A sesame seed", len: "2 mm", wt: "<1 g", stage: "embryo-early",
    baby: "The neural tube — which becomes the brain and spinal cord — is closing. A tiny heart tube begins to pulse, though it is far too small to hear.",
    you: "Fatigue that feels different from ordinary tiredness. Nausea may begin. Breasts often feel heavy and sore.",
    care: "Folic acid genuinely matters this week; it is exactly when the neural tube closes. Avoid over-the-counter medicines unless a doctor has confirmed they are safe." },
  { w: 6, size: "A grain of rice", len: "4 mm", wt: "<1 g", stage: "embryo-early",
    baby: "A heartbeat can usually be seen on a transvaginal scan around now. Dark spots mark where eyes will form, and small buds appear where arms and legs will grow.",
    you: "Morning sickness — which rarely confines itself to mornings — often arrives. Strong food aversions and a heightened sense of smell are common.",
    care: "A first scan is often done between six and eight weeks to confirm the pregnancy is in the right place and to date it accurately." },
  { w: 7, size: "A green pea", len: "10 mm", wt: "1 g", stage: "embryo-early",
    baby: "The brain is growing quickly. Arm and leg buds lengthen and begin to develop paddle-like ends. The umbilical cord is forming.",
    you: "Nausea often peaks around now. You may need to pass urine far more frequently. Emotions can feel unusually close to the surface.",
    care: "Eat small amounts often rather than three meals. If you cannot keep fluids down at all, contact the clinic — that needs treating, not enduring." },
  { w: 8, size: "A rajma bean", len: "16 mm", wt: "1 g", stage: "embryo-late",
    baby: "Every major organ has started to form. Fingers and toes are webbed but visible, and the tail-like tip of the spine has almost disappeared.",
    you: "Your uterus is roughly the size of a large orange, though nothing shows externally yet. Tiredness is often profound.",
    care: "This is when booking bloods are usually arranged: blood group and Rhesus status, haemoglobin, thyroid, blood sugar and infection screening." },
  { w: 9, size: "A grape", len: "23 mm", wt: "2 g", stage: "embryo-late",
    baby: "The embryo now has recognisably human proportions. Tiny muscles begin to work, so there is movement — far too faint for you to feel.",
    you: "Waistbands feel tighter, mostly from bloating rather than the baby. Breasts may have gone up a size.",
    care: "Gentle activity is good for you. Keep up fluids and fibre; constipation is very common from now on." },
  { w: 10, size: "An amla", len: "3.1 cm", wt: "4 g", stage: "fetus-early",
    baby: "From this week the term changes from embryo to fetus. The critical building phase is complete; from here it is growth and refinement. Fingers and toes are fully separated and tiny nails begin.",
    you: "Nausea may start to ease for some. Visible veins across the chest are normal — blood volume is rising steadily.",
    care: "Non-invasive prenatal testing, if you choose it, can be done from about ten weeks. Discuss what it does and does not tell you before deciding." },
  { w: 11, size: "A lime", len: "4.1 cm", wt: "7 g", stage: "fetus-early",
    baby: "The head is still around half the total length. Tooth buds form under the gums, and the diaphragm develops — your baby may already be practising hiccups.",
    you: "Sickness often begins to lift. Some women notice their skin becoming clearer, others the opposite.",
    care: "The nuchal translucency scan window opens now and runs to 13 weeks and 6 days. It is usually combined with a blood test." },
  { w: 12, size: "A big lemon", len: "5.4 cm", wt: "14 g", stage: "fetus-early",
    baby: "Reflexes are appearing — the fingers can curl and the toes flex. The kidneys begin to produce urine into the amniotic fluid.",
    you: "The uterus is rising out of the pelvis and can be felt just above the pubic bone. Many women feel noticeably more human this week.",
    care: "A milestone many people wait for: the chance of miscarriage falls considerably after twelve weeks. Many couples choose to share the news now." },
  { w: 13, size: "A guava", len: "7.4 cm", wt: "23 g", stage: "fetus-early",
    baby: "Vocal cords form. Fine hair called lanugo begins to appear, and the intestines move from the umbilical cord into the abdomen where they belong.",
    you: "The end of the first trimester. Energy often begins to return and appetite comes back.",
    care: "Make sure the dating and nuchal scan results have been reviewed with you and you understand what they mean." },
  { w: 14, size: "A small apple", len: "8.7 cm", wt: "43 g", stage: "fetus-mid",
    baby: "Facial muscles work, so there is squinting and frowning. The baby can suck a thumb. The liver and spleen start doing their jobs.",
    you: "The second trimester begins. Many women describe this as the stretch where they finally feel well.",
    care: "A good time to start thinking about iron intake. Aim for regular gentle exercise if you have been cleared for it." },
  { w: 15, size: "An orange", len: "10.1 cm", wt: "70 g", stage: "fetus-mid",
    baby: "Bones are hardening. The baby can sense bright light through closed eyelids and is beginning to hear muffled sound.",
    you: "Nasal congestion and occasional nosebleeds are common — pregnancy increases blood flow to the lining of the nose.",
    care: "If offered, the quadruple screening blood test is usually taken between 15 and 20 weeks." },
  { w: 16, size: "A large orange", len: "11.6 cm", wt: "100 g", stage: "fetus-mid",
    baby: "The baby is making coordinated movements. If this is not your first pregnancy, you may feel the first flutters around now.",
    you: "A visible bump for many. Round ligament pain — a sharp pull low on one side when you move suddenly — is normal.",
    care: "Blood pressure and urine are checked at each visit from here on. Sleep on your side rather than flat on your back when you can." },
  { w: 17, size: "A pomegranate", len: "13 cm", wt: "140 g", stage: "fetus-mid",
    baby: "Fat begins to form under the skin. The umbilical cord thickens and strengthens. Fingerprints are forming.",
    you: "Appetite is often strong now. Some women notice darker patches of skin on the face or a line down the abdomen.",
    care: "Iron and calcium supplementation is typically started around this stage, as advised for you." },
  { w: 18, size: "A sweet potato", len: "14.2 cm", wt: "190 g", stage: "fetus-mid",
    baby: "Hearing is developing properly — your voice and your heartbeat are the constant background. Nerve fibres are gaining their protective coating.",
    you: "First-time mothers often feel movement between 18 and 22 weeks. It can feel like bubbles or a muscle twitch.",
    care: "The detailed anomaly scan is usually done between 18 and 22 weeks. Set aside proper time for it." },
  { w: 19, size: "A mango", len: "15.3 cm", wt: "240 g", stage: "fetus-mid",
    baby: "A greasy white coating called vernix forms to protect the skin in the amniotic fluid. In girls, the ovaries already contain their lifetime supply of eggs.",
    you: "Leg cramps, especially at night, and mild dizziness on standing quickly.",
    care: "Stay well hydrated. Rise slowly from lying or sitting." },
  { w: 20, size: "A banana", len: "25.6 cm", wt: "300 g", stage: "fetus-mid",
    baby: "Halfway. From this week length is measured head to heel rather than head to bottom, which is why the number jumps. The baby has regular sleep and wake cycles.",
    you: "The top of the uterus reaches about the level of your navel. Movements are becoming unmistakable.",
    care: "The anomaly scan checks the heart, brain, spine, kidneys, limbs and the position of the placenta." },
  { w: 21, size: "A carrot", len: "26.7 cm", wt: "360 g", stage: "fetus-mid",
    baby: "The baby swallows small amounts of amniotic fluid, which helps the digestive system practise. Taste buds are forming.",
    you: "Stretch marks may appear on the abdomen, breasts or thighs. Braxton Hicks tightenings can begin.",
    care: "Moisturiser will not prevent stretch marks, but it helps with itching. Persistent intense itching should always be reported." },
  { w: 22, size: "A small papaya", len: "27.8 cm", wt: "430 g", stage: "fetus-mid",
    baby: "Eyebrows and eyelashes appear. The baby now looks like a miniature newborn, just very thin and red.",
    you: "Backache as your centre of gravity shifts. Swollen feet by evening.",
    care: "Good supportive footwear helps more than anything else at this stage. Elevate your feet when you can." },
  { w: 23, size: "A bottle gourd", len: "28.9 cm", wt: "500 g", stage: "fetus-mid",
    baby: "Blood vessels in the lungs are developing in preparation for breathing. Loud noises outside can startle the baby.",
    you: "Movements should be settling into a pattern you recognise.",
    care: "Learn your baby's normal pattern now. Any reduction in movement from this point onwards should be reported the same day — never wait until morning." },
  { w: 24, size: "A corn cob", len: "30 cm", wt: "600 g", stage: "fetus-late",
    baby: "An important threshold: with specialist neonatal care, babies born from around this point can survive. The lungs begin producing surfactant.",
    you: "The bump is unmistakable. Heartburn is common as the stomach is pushed upwards.",
    care: "The glucose tolerance test for gestational diabetes is usually done between 24 and 28 weeks." },
  { w: 25, size: "A cauliflower", len: "34.6 cm", wt: "660 g", stage: "fetus-late",
    baby: "The baby is putting on fat and the skin is smoothing out. Hands are fully formed and grasping.",
    you: "Restless legs at night, and more frequent trips to the bathroom.",
    care: "Discuss your birth preferences early rather than late — it is a conversation, not a form." },
  { w: 26, size: "A coconut", len: "35.6 cm", wt: "760 g", stage: "fetus-late",
    baby: "The eyes open for the first time. Brain wave activity for hearing and sight becomes detectable.",
    you: "Rib discomfort as the uterus presses upwards. Shortness of breath on stairs.",
    care: "If you are Rhesus negative, anti-D prophylaxis is usually given around 28 weeks — confirm the plan now." },
  { w: 27, size: "A cabbage", len: "36.6 cm", wt: "875 g", stage: "fetus-late",
    baby: "Regular breathing movements, practising with amniotic fluid. The baby may hiccup, which you will feel as rhythmic taps.",
    you: "The end of the second trimester. Sleep is becoming harder to arrange comfortably.",
    care: "A pillow between the knees genuinely helps. The whooping cough vaccine is usually offered between 27 and 36 weeks." },
  { w: 28, size: "A brinjal", len: "37.6 cm", wt: "1 kg", stage: "fetus-late",
    baby: "The third trimester begins. The baby can blink, and is beginning to build the fat stores that will regulate temperature after birth.",
    you: "Appointments become more frequent. Braxton Hicks are more noticeable.",
    care: "Glucose tolerance test and anti-D, if applicable, are typically around now. Start counting movements daily." },
  { w: 29, size: "A small pumpkin", len: "38.6 cm", wt: "1.15 kg", stage: "fetus-late",
    baby: "Bones are fully formed but still soft, drawing heavily on your calcium. Muscles and lungs continue maturing.",
    you: "Heartburn, constipation and haemorrhoids are all common and all treatable.",
    care: "Do not put up with reflux or piles — both have safe treatments in pregnancy. Ask." },
  { w: 30, size: "A large cabbage", len: "39.9 cm", wt: "1.3 kg", stage: "fetus-late",
    baby: "The soft lanugo hair starts to disappear. The brain is growing rapidly and developing its characteristic folds.",
    you: "Fatigue returns. Swelling in the hands and feet increases.",
    care: "Sudden or severe swelling of the face and hands, with headache or visual disturbance, needs urgent assessment — do not wait for your next appointment." },
  { w: 31, size: "A muskmelon", len: "41.1 cm", wt: "1.5 kg", stage: "fetus-late",
    baby: "All five senses are working. The baby turns towards familiar voices.",
    you: "Colostrum may start to leak from the breasts. Movements feel stronger and more crowded.",
    care: "A growth scan is often arranged around 32 weeks to check the baby's growth and the placenta." },
  { w: 32, size: "A large papaya", len: "42.4 cm", wt: "1.7 kg", stage: "fetus-late",
    baby: "Most babies have settled head down by now, though there is still time to turn. Toenails are fully formed.",
    you: "Breathlessness as the uterus presses on the diaphragm.",
    care: "Growth scan, position check, and a proper conversation about your birth plan." },
  { w: 33, size: "A pineapple", len: "43.7 cm", wt: "1.9 kg", stage: "fetus-late",
    baby: "The immune system is developing, receiving antibodies from you. The skull bones stay deliberately soft and unfused to allow passage through the birth canal.",
    you: "Pelvic pressure and pubic bone discomfort.",
    care: "A pregnancy support belt helps some women considerably. Pack the hospital bag list, even if not the bag." },
  { w: 34, size: "A small jackfruit", len: "45 cm", wt: "2.1 kg", stage: "fetus-term",
    baby: "Lungs are nearly mature. Fingernails reach the fingertips.",
    you: "The baby may drop lower into the pelvis, which eases breathing but increases pressure below.",
    care: "Know the signs of labour, and know exactly when and where to call. Write the numbers somewhere you will find them at 3am." },
  { w: 35, size: "A large muskmelon", len: "46.2 cm", wt: "2.4 kg", stage: "fetus-term",
    baby: "Rapid weight gain — mostly fat, laid down under the skin. Space is tight, so movements feel like rolls and stretches rather than kicks.",
    you: "Frequent urination returns as the head presses on the bladder.",
    care: "Keep monitoring movements. The pattern may change in character, but it should not reduce." },
  { w: 36, size: "A bunch of bananas", len: "47.4 cm", wt: "2.6 kg", stage: "fetus-term",
    baby: "The baby is considered nearly term. Most of the lanugo and vernix has gone, though some remains at birth.",
    you: "Weekly appointments usually begin around now.",
    care: "Position is confirmed. If the baby is breech, options including turning the baby are discussed at this stage." },
  { w: 37, size: "A small watermelon", len: "48.6 cm", wt: "2.9 kg", stage: "fetus-term",
    baby: "Early term. The baby is practising breathing, sucking and blinking, and is essentially ready.",
    you: "You may lose the mucus plug — a sign things are moving, though labour can still be days or weeks away.",
    care: "Know the difference between Braxton Hicks and true labour: real contractions become longer, stronger and closer together, and do not settle when you change position." },
  { w: 38, size: "A watermelon", len: "49.8 cm", wt: "3.1 kg", stage: "fetus-term",
    baby: "Fully developed, still adding fat. The brain and lungs keep maturing right up to birth and beyond.",
    you: "Difficulty sleeping, and a strong urge to organise everything in the house.",
    care: "Rest whenever you can. Confirm your transport and your plan for getting to hospital." },
  { w: 39, size: "A large watermelon", len: "50.7 cm", wt: "3.3 kg", stage: "fetus-term",
    baby: "Full term. The chest is prominent, the skin has lost its redness, and the grasp is firm.",
    you: "Contractions may begin at any point. Some women feel a sudden burst of energy.",
    care: "Go in if your waters break, if contractions are five minutes apart for an hour, if there is any bleeding, or if movements reduce." },
  { w: 40, size: "A full watermelon", len: "51.2 cm", wt: "3.5 kg", stage: "fetus-term",
    baby: "Your due date — which is an estimate, not a deadline. Only a small minority of babies arrive exactly on it.",
    you: "Every kind of impatient.",
    care: "Monitoring continues past 40 weeks, and induction is usually discussed somewhere between 41 and 42 weeks. Keep counting movements right up to labour." },
];

export const weekData = (w: number) => WEEKS.find((x) => x.w === w);
export const MAX_WEEK = 40;

/**
 * Stage for any week, including fractional ones.
 *
 * The journey scrubs continuously from 4 to 40 rather than stepping between
 * forty separate pages, so the illustration needs a stage for week 17.3 as
 * readily as for week 17.
 */
export function stageForWeek(w: number): FetalStage {
  if (w < 3) return "preconception";
  if (w < 5) return "blastocyst";
  if (w < 8) return "embryo-early";
  if (w < 11) return "embryo-late";
  if (w < 20) return "fetus-early";
  if (w < 28) return "fetus-mid";
  if (w < 37) return "fetus-late";
  return "fetus-term";
}

/** Per-trimester detail for the three trimester pages. */
export type TriDetail = {
  intro: string[];
  checks: { name: string; when: string; why: string }[];
  feel: string[];
  redFlags: string[];
};

export const TRI_DETAIL: Record<1 | 2 | 3, TriDetail> = {
  1: {
    intro: [
      "The first trimester does the most work and shows the least for it. Every organ your baby will ever have is laid down in these thirteen weeks, at a point where you may not look pregnant at all and may feel too unwell to enjoy the fact that you are.",
      "It is also the stretch people find loneliest, because many wait until twelve weeks before telling anyone. If something worries you, that is what the clinic is for — you do not have to wait for a scheduled appointment.",
    ],
    checks: [
      { name: "Booking appointment", when: "Ideally 6–10 weeks", why: "History, medication review, blood pressure, and an accurate due date. Early dating is more reliable than late dating." },
      { name: "First scan", when: "6–9 weeks", why: "Confirms the pregnancy is inside the uterus, the number of babies, and the heartbeat." },
      { name: "Booking bloods", when: "At booking", why: "Blood group and Rh, haemoglobin, thyroid, sugar, and screening for infections that are treatable in pregnancy." },
      { name: "Nuchal scan & screening", when: "11–13+6 weeks", why: "Combined screening for chromosomal conditions, plus a first structural look." },
    ],
    feel: [
      "Nausea and food aversions, often worse on an empty stomach",
      "Exhaustion that sleep does not fix",
      "Tender breasts, and needing to pass urine more often",
      "Mood swings — hormones, not weakness",
      "Or almost nothing at all, which is equally normal",
    ],
    redFlags: [
      "Bleeding heavier than spotting, or with clots",
      "One-sided pain in the lower abdomen, or shoulder-tip pain",
      "Vomiting so persistent you cannot keep fluids down",
      "Fever above 38 °C, or burning when passing urine",
      "Fainting or severe dizziness",
    ],
  },
  2: {
    intro: [
      "For most women this is the stretch that feels manageable again. Sickness settles, energy comes back, and somewhere in here you feel the first definite movement — which changes the whole thing from an idea into a person.",
      "It is also when the most detailed scan of the pregnancy happens, and when conditions like gestational diabetes and anaemia are looked for, while there is still plenty of time to treat them.",
    ],
    checks: [
      { name: "Anomaly scan", when: "18–22 weeks", why: "A detailed look at the brain, heart, spine, kidneys, face and limbs, and at where the placenta is lying." },
      { name: "Glucose test", when: "24–28 weeks", why: "Gestational diabetes usually has no symptoms at all and is easily missed without testing." },
      { name: "Haemoglobin recheck", when: "Around 26 weeks", why: "Anaemia is common in the second half and is straightforward to correct." },
      { name: "Growth and blood pressure", when: "Each visit", why: "Fundal height, blood pressure and urine — the checks that catch pre-eclampsia early." },
    ],
    feel: [
      "First movements — flutters at first, unmistakable later",
      "A visible bump, and stretching or pulling at the sides",
      "Backache as posture shifts",
      "Nasal congestion, bleeding gums, vivid dreams",
      "Return of appetite and energy",
    ],
    redFlags: [
      "Any vaginal bleeding",
      "A gush or steady trickle of fluid",
      "Severe headache with visual disturbance or swelling of the face and hands",
      "Regular tightening before 37 weeks",
      "A definite reduction in movement once a pattern is established",
    ],
  },
  3: {
    intro: [
      "The third trimester is mostly growth — your baby roughly doubles in weight — and preparation, for the lungs and for you. Visits become more frequent because this is when blood pressure, growth and position matter most.",
      "This is also the stretch where knowing what is urgent matters. Reduced movement is never something to sleep on and see about in the morning; it is a same-day call, every time.",
    ],
    checks: [
      { name: "More frequent visits", when: "Fortnightly, then weekly", why: "Blood pressure, urine, growth and position — the things that change fast at the end." },
      { name: "Whooping cough vaccine", when: "From 28 weeks", why: "Antibodies cross the placenta and protect the baby in the first weeks of life." },
      { name: "Growth scan", when: "If indicated", why: "Checks growth, fluid and blood flow when measurements or history suggest a closer look." },
      { name: "Position check", when: "From 36 weeks", why: "Most babies are head-down by now. If yours is not, there are options — and they work better discussed early." },
    ],
    feel: [
      "Breathlessness, heartburn and poor sleep",
      "Braxton Hicks — irregular, and they settle when you move",
      "Swelling of the feet by the end of the day",
      "Pelvic pressure as the head engages",
      "A strong urge to clean and organise everything",
    ],
    redFlags: [
      "Reduced or changed movement — call the same day, do not wait",
      "Severe headache, visual disturbance, or pain under the ribs",
      "Bleeding, or fluid leaking",
      "Contractions before 37 weeks",
      "Sudden swelling of the face, hands or feet",
    ],
  },
};

export const TRI_SLUGS = ["first-trimester", "second-trimester", "third-trimester"] as const;
export type TriSlug = (typeof TRI_SLUGS)[number];
export const triBySlug = (s: string) => {
  const i = TRI_SLUGS.indexOf(s as TriSlug);
  return i === -1 ? null : { ...TRIMESTERS[i], slug: TRI_SLUGS[i] };
};

/**
 * The milestones the journey is told through.
 *
 * Forty separate pages was the wrong shape — nobody reads forty pages, and it
 * buried the moments that actually matter to a patient. These are the eight
 * points people ask about; the week-by-week detail is still there, but as
 * something you scrub through rather than navigate to.
 */
export type Milestone = {
  w: number;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
};

export const MILESTONES: Milestone[] = [
  {
    w: 4,
    eyebrow: "Weeks 1–4",
    title: "A positive test, and a ball of cells",
    body: "Pregnancy is dated from the first day of your last period, so the first fortnight happens before conception — a genuinely confusing point that trips almost everyone up. By week four the cells have burrowed into the lining of the uterus and split in two: one half becomes your baby, the other becomes the placenta.",
    points: ["A home test is reliable around now", "Folic acid matters most in these early weeks", "Book early — accurate dating is easier before 12 weeks"],
  },
  {
    w: 7,
    eyebrow: "Weeks 5–8",
    title: "A heartbeat, at about the size of a blueberry",
    body: "The heart starts beating near the end of week five and is usually visible on a scan by six to seven weeks, at roughly 110–160 beats a minute. The embryo is curled in a C shape with a large head, dark eye spots and small buds where the arms and legs will be.",
    points: ["Nausea often begins now, and is a normal sign", "The first scan confirms dates and location", "Spotting is common — but always worth a call"],
  },
  {
    w: 12,
    eyebrow: "Weeks 9–13",
    title: "Recognisably a baby",
    body: "Fingers and toes have separated, the tail has gone, and all the major organs are formed even though none of them are finished. This is when the first-trimester scan happens, and when the risk of miscarriage drops considerably.",
    points: ["Nuchal scan and first-trimester screening", "Sickness usually starts to ease from here", "The uterus rises out of the pelvis"],
  },
  {
    w: 16,
    eyebrow: "Weeks 14–17",
    title: "The kind stretch begins",
    body: "Energy usually returns. The baby can move every joint, is growing hair and eyebrows, and is starting to hear. Most people begin to look pregnant somewhere in here, though first pregnancies often show later.",
    points: ["Appetite and energy return for most women", "Skin changes and a darker line down the belly", "Movements start, but are easy to mistake for wind"],
  },
  {
    w: 20,
    eyebrow: "Weeks 18–21",
    title: "Halfway, and the big scan",
    body: "The anomaly scan checks the brain, heart, spine, kidneys, face and limbs in detail, and looks at where the placenta is sitting. From this week, length is measured head to heel rather than head to bottom — which is why the numbers appear to jump.",
    points: ["The 20-week anomaly scan", "First definite kicks for many women", "The baby now has a sleep and wake rhythm"],
  },
  {
    w: 26,
    eyebrow: "Weeks 22–27",
    title: "Eyes open, and a real chance outside",
    body: "The eyes open, the lungs begin producing surfactant, and a baby born at the end of this stretch has a real, though difficult, chance of survival with intensive care. You will start being asked to notice a pattern in the movements.",
    points: ["Glucose test for gestational diabetes", "Learn your baby's normal movement pattern", "Backache and heartburn become common"],
  },
  {
    w: 32,
    eyebrow: "Weeks 28–35",
    title: "Growing fast, running out of room",
    body: "Mostly weight now — the baby roughly doubles between 28 and 36 weeks, laying down the fat that will regulate temperature after birth. Bones harden, though the skull stays deliberately soft for the journey out. Visits become more frequent.",
    points: ["Growth scan if measurements suggest it", "Whooping cough vaccination", "Reduced movement is always an emergency, never a wait-and-see"],
  },
  {
    w: 40,
    eyebrow: "Weeks 36–40",
    title: "Head down, and ready",
    body: "Most babies settle head-down by 36 weeks; if yours has not, there are options and they are worth discussing early. From 37 weeks the pregnancy is term. Your due date is an estimate — only a small minority of babies arrive exactly on it.",
    points: ["Position check, and a plan if the baby is breech", "Know true labour from Braxton Hicks", "Monitoring continues past 40 weeks"],
  },
];
