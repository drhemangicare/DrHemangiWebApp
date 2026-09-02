/**
 * Site translations.
 *
 * Keys are the English strings themselves, so an untranslated string falls back
 * to perfectly good English rather than to a missing-key placeholder — and so
 * adding a language never means touching a component.
 *
 * SCOPE: the interface and the whole pregnancy section — milestones, trimester
 * detail, the checks, the warning signs and the size comparisons — are
 * translated in `content.<lang>.ts`. Condition prose is still English and says
 * so in the reader's own language via <UntranslatedNote>.
 *
 * EVERY translation here needs Dr Hemangi's eye before launch. This is medical
 * wording in three languages under a doctor's name; treat the files as drafts
 * for her to correct, not as finished copy.
 *
 * To add a language: add an entry to LOCALES and a block to DICT. Nothing else.
 */

export const LOCALES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "mr", label: "Marathi", native: "मराठी" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];
export const DEFAULT_LOCALE: Locale = "en";
export const isLocale = (v: string): v is Locale => LOCALES.some((l) => l.code === v);

import { contentHi } from "./content.hi";
import { contentGu } from "./content.gu";
import { contentMr } from "./content.mr";

type Dict = Record<string, string>;

const hi: Dict = {
  // navigation
  "Conditions": "समस्याएँ",
  "Pregnancy": "गर्भावस्था",
  "Care": "उपचार",
  "Clinic": "क्लिनिक",
  "Book consultation": "परामर्श बुक करें",
  "Book a consultation": "परामर्श बुक करें",
  "My bookings": "मेरी बुकिंग",
  "Contact the clinic": "क्लिनिक से संपर्क करें",
  "Open menu": "मेन्यू खोलें",
  "Close menu": "मेन्यू बंद करें",
  "Language": "भाषा",
  // conditions
  "PCOS": "पीसीओएस",
  "PCOS (Polycystic Ovary Syndrome)": "पीसीओएस (पॉलीसिस्टिक ओवरी सिंड्रोम)",
  "All conditions": "सभी समस्याएँ",
  "Endometriosis": "एंडोमेट्रियोसिस",
  "Uterine fibroids": "गर्भाशय की गाँठें",
  "Irregular periods": "अनियमित माहवारी",
  "Difficulty conceiving": "गर्भधारण में कठिनाई",
  "Recurrent miscarriage": "बार-बार गर्भपात",
  "All conditions →": "सभी समस्याएँ →",
  "What it actually is": "यह असल में क्या है",
  "What you might notice": "आपको क्या महसूस हो सकता है",
  "The tests that are actually useful": "कौन-सी जाँचें वास्तव में उपयोगी हैं",
  "Treatment, in the order it's usually tried": "इलाज, उसी क्रम में जिसमें आमतौर पर किया जाता है",
  "What you were probably told that isn't true": "जो आपसे कहा गया, पर सच नहीं है",
  "Don't wait for an appointment if…": "इन स्थितियों में अपॉइंटमेंट का इंतज़ार न करें…",
  "Read another": "एक और पढ़ें",
  "Next step": "अगला कदम",
  // pregnancy
  "Week by week": "सप्ताह दर सप्ताह",
  "Start the journey": "यात्रा शुरू करें",
  "Find my week": "मेरा सप्ताह जानें",
  "Find your week": "अपना सप्ताह जानें",
  "The whole journey": "पूरी यात्रा",
  "All weeks": "सभी सप्ताह",
  "Week": "सप्ताह",
  "Your baby": "आपका शिशु",
  "You this week": "इस सप्ताह आप",
  "Care & checks": "देखभाल और जाँच",
  "Length": "लंबाई",
  "Weight": "वज़न",
  "Trimester": "तिमाही",
  "First trimester": "पहली तिमाही",
  "Second trimester": "दूसरी तिमाही",
  "Third trimester": "तीसरी तिमाही",
  "The 40-week journey": "40 सप्ताह की यात्रा",
  "Read this trimester": "यह तिमाही पढ़ें",
  "The milestones": "मुख्य पड़ाव",
  "Your appointments and checks": "आपकी अपॉइंटमेंट और जाँचें",
  "What you may feel": "आप क्या महसूस कर सकती हैं",
  "Your week in detail": "आपका सप्ताह विस्तार से",
  "Not sure which week you are in?": "पता नहीं कौन-सा सप्ताह चल रहा है?",
  "Choose a date": "तारीख़ चुनें",
  "Today": "आज",
  "Clear": "हटाएँ",
  "Previous month": "पिछला महीना",
  "Next month": "अगला महीना",
  // services & footer
  "All services": "सभी सेवाएँ",
  "Fertility & IVF": "प्रजनन और आईवीएफ",
  "About Dr Hemangi": "डॉ. हेमांगी के बारे में",
  "FAQ": "सामान्य प्रश्न",
  "Contact & directions": "संपर्क और पता",
  "Explained": "समझाया गया",
  "Reach us": "हम तक पहुँचें",
  "Medical emergency?": "चिकित्सा आपातकाल?",
  "Privacy": "गोपनीयता",
  "Terms": "शर्तें",
  "Refund policy": "रिफ़ंड नीति",
  // notices
  "This page is general information, not medical advice.":
    "यह पृष्ठ सामान्य जानकारी है, चिकित्सकीय सलाह नहीं।",
  "Detailed medical text is shown in English until Dr Hemangi has approved the translation.":
    "विस्तृत चिकित्सकीय जानकारी तब तक अंग्रेज़ी में दिखाई जाएगी जब तक डॉ. हेमांगी अनुवाद को स्वीकृति नहीं दे देतीं।",
};

const gu: Dict = {
  "Conditions": "સમસ્યાઓ",
  "Pregnancy": "ગર્ભાવસ્થા",
  "Care": "સારવાર",
  "Clinic": "ક્લિનિક",
  "Book consultation": "પરામર્શ બુક કરો",
  "Book a consultation": "પરામર્શ બુક કરો",
  "My bookings": "મારી બુકિંગ",
  "Contact the clinic": "ક્લિનિકનો સંપર્ક કરો",
  "Open menu": "મેનુ ખોલો",
  "Close menu": "મેનુ બંધ કરો",
  "Language": "ભાષા",
  "PCOS": "પીસીઓએસ",
  "PCOS (Polycystic Ovary Syndrome)": "પીસીઓએસ (પોલિસિસ્ટિક ઓવરી સિન્ડ્રોમ)",
  "All conditions": "બધી સમસ્યાઓ",
  "Endometriosis": "એન્ડોમેટ્રિઓસિસ",
  "Uterine fibroids": "ગર્ભાશયની ગાંઠો",
  "Irregular periods": "અનિયમિત માસિક",
  "Difficulty conceiving": "ગર્ભધારણમાં મુશ્કેલી",
  "Recurrent miscarriage": "વારંવાર ગર્ભપાત",
  "All conditions →": "બધી સમસ્યાઓ →",
  "What it actually is": "આ ખરેખર શું છે",
  "What you might notice": "તમને શું જણાઈ શકે",
  "The tests that are actually useful": "કઈ તપાસ ખરેખર ઉપયોગી છે",
  "Treatment, in the order it's usually tried": "સારવાર, સામાન્ય રીતે જે ક્રમમાં કરાય છે",
  "What you were probably told that isn't true": "જે તમને કહેવાયું, પણ સાચું નથી",
  "Don't wait for an appointment if…": "આ સ્થિતિમાં એપોઇન્ટમેન્ટની રાહ ન જુઓ…",
  "Read another": "બીજું વાંચો",
  "Next step": "આગળનું પગલું",
  "Week by week": "અઠવાડિયે અઠવાડિયે",
  "Start the journey": "યાત્રા શરૂ કરો",
  "Find my week": "મારું અઠવાડિયું શોધો",
  "Find your week": "તમારું અઠવાડિયું શોધો",
  "The whole journey": "સંપૂર્ણ યાત્રા",
  "All weeks": "બધાં અઠવાડિયાં",
  "Week": "અઠવાડિયું",
  "Your baby": "તમારું બાળક",
  "You this week": "આ અઠવાડિયે તમે",
  "Care & checks": "સંભાળ અને તપાસ",
  "Length": "લંબાઈ",
  "Weight": "વજન",
  "Trimester": "ત્રિમાસિક",
  "First trimester": "પ્રથમ ત્રિમાસિક",
  "Second trimester": "બીજું ત્રિમાસિક",
  "Third trimester": "ત્રીજું ત્રિમાસિક",
  "The 40-week journey": "40 અઠવાડિયાંની યાત્રા",
  "Read this trimester": "આ ત્રિમાસિક વાંચો",
  "The milestones": "મુખ્ય તબક્કા",
  "Your appointments and checks": "તમારી એપોઇન્ટમેન્ટ અને તપાસ",
  "What you may feel": "તમે શું અનુભવી શકો",
  "Your week in detail": "તમારું અઠવાડિયું વિગતે",
  "Not sure which week you are in?": "કયું અઠવાડિયું ચાલે છે તે ખબર નથી?",
  "Choose a date": "તારીખ પસંદ કરો",
  "Today": "આજે",
  "Clear": "દૂર કરો",
  "Previous month": "પાછલો મહિનો",
  "Next month": "આગલો મહિનો",
  "All services": "બધી સેવાઓ",
  "Fertility & IVF": "પ્રજનન અને આઈવીએફ",
  "About Dr Hemangi": "ડૉ. હેમાંગી વિશે",
  "FAQ": "સામાન્ય પ્રશ્નો",
  "Contact & directions": "સંપર્ક અને સરનામું",
  "Explained": "સમજાવ્યું",
  "Reach us": "અમારો સંપર્ક",
  "Medical emergency?": "તાત્કાલિક તબીબી જરૂર?",
  "Privacy": "ગોપનીયતા",
  "Terms": "શરતો",
  "Refund policy": "રિફંડ નીતિ",
  "This page is general information, not medical advice.":
    "આ પાનું સામાન્ય માહિતી છે, તબીબી સલાહ નથી.",
  "Detailed medical text is shown in English until Dr Hemangi has approved the translation.":
    "વિગતવાર તબીબી લખાણ અંગ્રેજીમાં બતાવાય છે, જ્યાં સુધી ડૉ. હેમાંગી અનુવાદને મંજૂરી ન આપે.",
};

const mr: Dict = {
  "Conditions": "समस्या",
  "Pregnancy": "गर्भधारणा",
  "Care": "उपचार",
  "Clinic": "क्लिनिक",
  "Book consultation": "सल्ला बुक करा",
  "Book a consultation": "सल्ला बुक करा",
  "My bookings": "माझी बुकिंग",
  "Contact the clinic": "क्लिनिकशी संपर्क साधा",
  "Open menu": "मेनू उघडा",
  "Close menu": "मेनू बंद करा",
  "Language": "भाषा",
  "PCOS": "पीसीओएस",
  "PCOS (Polycystic Ovary Syndrome)": "पीसीओएस (पॉलीसिस्टिक ओव्हरी सिंड्रोम)",
  "All conditions": "सर्व समस्या",
  "Endometriosis": "एंडोमेट्रिओसिस",
  "Uterine fibroids": "गर्भाशयातील गाठी",
  "Irregular periods": "अनियमित पाळी",
  "Difficulty conceiving": "गर्भधारणेत अडचण",
  "Recurrent miscarriage": "वारंवार गर्भपात",
  "All conditions →": "सर्व समस्या →",
  "What it actually is": "हे नेमके काय आहे",
  "What you might notice": "तुम्हाला काय जाणवू शकते",
  "The tests that are actually useful": "कोणत्या तपासण्या खरोखर उपयुक्त आहेत",
  "Treatment, in the order it's usually tried": "उपचार, सहसा ज्या क्रमाने केले जातात",
  "What you were probably told that isn't true": "जे तुम्हाला सांगितले गेले, पण खरे नाही",
  "Don't wait for an appointment if…": "अशा वेळी अपॉइंटमेंटची वाट पाहू नका…",
  "Read another": "आणखी वाचा",
  "Next step": "पुढील पाऊल",
  "Week by week": "आठवड्यागणिक",
  "Start the journey": "प्रवास सुरू करा",
  "Find my week": "माझा आठवडा शोधा",
  "Find your week": "तुमचा आठवडा शोधा",
  "The whole journey": "संपूर्ण प्रवास",
  "All weeks": "सर्व आठवडे",
  "Week": "आठवडा",
  "Your baby": "तुमचे बाळ",
  "You this week": "या आठवड्यात तुम्ही",
  "Care & checks": "काळजी आणि तपासण्या",
  "Length": "लांबी",
  "Weight": "वजन",
  "Trimester": "तिमाही",
  "First trimester": "पहिली तिमाही",
  "Second trimester": "दुसरी तिमाही",
  "Third trimester": "तिसरी तिमाही",
  "The 40-week journey": "40 आठवड्यांचा प्रवास",
  "Read this trimester": "ही तिमाही वाचा",
  "The milestones": "महत्त्वाचे टप्पे",
  "Your appointments and checks": "तुमच्या अपॉइंटमेंट आणि तपासण्या",
  "What you may feel": "तुम्हाला काय जाणवेल",
  "Your week in detail": "तुमचा आठवडा सविस्तर",
  "Not sure which week you are in?": "कोणता आठवडा सुरू आहे माहीत नाही?",
  "Choose a date": "तारीख निवडा",
  "Today": "आज",
  "Clear": "काढून टाका",
  "Previous month": "मागील महिना",
  "Next month": "पुढील महिना",
  "All services": "सर्व सेवा",
  "Fertility & IVF": "प्रजनन आणि आयव्हीएफ",
  "About Dr Hemangi": "डॉ. हेमांगी यांच्याविषयी",
  "FAQ": "नेहमीचे प्रश्न",
  "Contact & directions": "संपर्क आणि पत्ता",
  "Explained": "समजावून सांगितले",
  "Reach us": "आमच्यापर्यंत पोहोचा",
  "Medical emergency?": "वैद्यकीय आणीबाणी?",
  "Privacy": "गोपनीयता",
  "Terms": "अटी",
  "Refund policy": "परतावा धोरण",
  "This page is general information, not medical advice.":
    "हे पान सामान्य माहिती आहे, वैद्यकीय सल्ला नाही.",
  "Detailed medical text is shown in English until Dr Hemangi has approved the translation.":
    "डॉ. हेमांगी अनुवादाला मान्यता देईपर्यंत सविस्तर वैद्यकीय मजकूर इंग्रजीत दाखवला जातो.",
};

export const DICT: Record<Locale, Dict> = {
  en: {},
  hi: { ...hi, ...contentHi },
  gu: { ...gu, ...contentGu },
  mr: { ...mr, ...contentMr },
};

/** Translate, falling back to the English source string. */
export const translate = (locale: Locale, s: string) => DICT[locale]?.[s] ?? s;
