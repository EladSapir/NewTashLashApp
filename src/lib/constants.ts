import { HealthItemId, Service } from "./types";

/* ==========================================================================
 * TREATMENTS LIST
 * --------------------------------------------------------------------------
 * Edit this file to add / remove / rename treatments or change their
 * durations. Rules:
 *   - `id` is an internal identifier. Keep it in English (letters only).
 *   - `durationMinutes` MUST be a multiple of 30 (slot size).
 *   - After adding a new treatment, also add a label + description under
 *     "services" in `messages/he.json` using the same id.
 *
 * The order of the entries here is the order shown to the client.
 * ========================================================================== */

export const SERVICES = {
  lashLift: {
    id: "lashLift",
    durationMinutes: 60,
  },
  browLiftFull: {
    id: "browLiftFull",
    durationMinutes: 90,
  },
  lashBrowLift: {
    id: "lashBrowLift",
    durationMinutes: 120,
  },
  browShape: {
    id: "browShape",
    durationMinutes: 60,
  },
  browMustache: {
    id: "browMustache",
    durationMinutes: 60,
  },
  lashLiftBrowShape: {
    id: "lashLiftBrowShape",
    durationMinutes: 120,
  },
} as const satisfies Record<string, Service>;

export type ServiceId = keyof typeof SERVICES;

export const SERVICE_IDS: ServiceId[] = Object.keys(SERVICES) as ServiceId[];

export const SLOT_INTERVAL_MINUTES = 30;

export const HEALTH_NONE_ID = "none";

export type HealthFormOption = {
  id: HealthItemId;
  label: string;
  allowDetails?: boolean;
  detailsLabel?: string;
};

export type ServiceHealthForm = {
  title: string;
  intro: string;
  medicalOptions: HealthFormOption[];
  consentTitle: string;
  consentOptions: HealthFormOption[];
};

const DEFAULT_FORM_INTRO =
  "אנא קראי את השאלון בעיון והשיבי על כל השאלות בכנות באמצעות סימון במשבצת המתאימה.";

const buildSharedConsentOptions = () => [
  {
    id: "must_update_health_changes",
    label:
      "ידוע לי כי במקרה של רגישות, מצב רפואי או שינוי בריאותי רלוונטי, עליי לעדכן את המטפלת לפני תחילת הטיפול.",
  },
];

const BROW_SHAPE_FORM: ServiceHealthForm = {
  title: "טופס הצהרת בריאות והסכמה לטיפול – עיצוב גבות",
  intro: DEFAULT_FORM_INTRO,
  medicalOptions: [
    {
      id: "allergy_wax_dye",
      label: "האם קיימת רגישות / אלרגיה ידועה לחומרים קוסמטיים, שעווה או צבעים?",
      allowDetails: true,
    },
    {
      id: "roaccutane_recent",
      label: "האם נטלת / נוטלת רואקוטן ב־6–12 החודשים האחרונים?",
      allowDetails: true,
    },
    {
      id: "blood_thinners",
      label: "האם את נוטלת תרופות מדללות דם (כגון אספירין / קומדין / אליקוויס)?",
      allowDetails: true,
    },
    {
      id: "skin_diseases_face",
      label: "האם יש לך מחלות עור (כגון פסוריאזיס / אקזמה / דרמטיטיס)?",
      allowDetails: true,
    },
    {
      id: "active_irritation_brows",
      label: "האם קיימים פצעים, חתכים, אקנה פעיל, גירוי או דלקת באזור הגבות?",
      allowDetails: true,
    },
    {
      id: "recent_peeling_laser",
      label: "האם עברת פילינג כימי / טיפול לייזר / טיפול אסתטי באזור הפנים בשבועיים האחרונים?",
      allowDetails: true,
    },
    {
      id: "active_ingredients_face",
      label: "האם את משתמשת באופן קבוע בתכשירים המכילים חומצות, רטינול או חומרים פעילים באזור הפנים?",
      allowDetails: true,
    },
    {
      id: "pregnant_hormonal",
      label: "האם את בהריון / מניקה / נוטלת תרופות הורמונליות?",
      allowDetails: true,
    },
    { id: HEALTH_NONE_ID, label: "ללא" },
  ],
  consentTitle: "מידע חשוב על הטיפול",
  consentOptions: [
    ...buildSharedConsentOptions(),
    {
      id: "consent_brow_shape_methods",
      label: "ידוע לי כי הטיפול מתבצע בהתאם לצורך המקצועי ובשילוב שיטות שונות - חוט / שעווה / פינצטה.",
    },
    {
      id: "consent_brow_shape_temporary_reactions",
      label: "ידוע לי כי ייתכנו תגובות זמניות לאחר הטיפול, כגון אדמומיות קלה או רגישות בעור.",
    },
    {
      id: "consent_brow_shape_result_varies",
      label: "אני מבינה כי תוצאות הטיפול עשויות להשתנות בהתאם למבנה הגבות הטבעי, מצב העור, סוג השיער ורגישויות אישיות.",
    },
    {
      id: "consent_details_correct",
      label:
        "אני מצהירה כי כל הפרטים והמידע שנמסרו על ידי במסגרת טופס זה הינם נכונים, מלאים ומעודכנים, וכי לא הושמט כל מידע מהותי.",
    },
  ],
};

export const SERVICE_HEALTH_FORMS: Record<ServiceId, ServiceHealthForm> = {
  lashLift: {
    title: "טופס הצהרת בריאות והסכמה לטיפול – הרמת ריסים",
    intro: DEFAULT_FORM_INTRO,
    medicalOptions: [
      {
        id: "allergy_general",
        label: "האם ידועות לך רגישויות / אלרגיות כלשהן?",
        allowDetails: true,
      },
      {
        id: "contact_lenses_or_drops",
        label: "האם את מרכיבה עדשות מגע או משתמשת בטיפות עיניים כרגע?",
        allowDetails: true,
      },
      {
        id: "pregnant_hormonal",
        label: "האם את בהריון / מניקה / נוטלת תרופות הורמונליות?",
        allowDetails: true,
      },
      {
        id: "recent_eye_surgery",
        label: "האם עברת ניתוח בעיניים (לייזר / קטרקט) במהלך 3 החודשים האחרונים?",
        allowDetails: true,
      },
      {
        id: "eye_area_irritation",
        label: "האם קיים גירוי, אדמומיות, דלקת או יובש באזור הטיפול?",
        allowDetails: true,
      },
      { id: HEALTH_NONE_ID, label: "ללא" },
    ],
    consentTitle: "הצהרה ואישור טיפול",
    consentOptions: [
      ...buildSharedConsentOptions(),
      {
        id: "consent_lash_lift_treatment",
        label: "אני מאשרת לנטשה לבצע בי טיפול הרמת ריסים.",
      },
      {
        id: "consent_lash_lift_closed_eyes",
        label: "אני מודעת לכך שעליי להיות עם עיניים עצומות במהלך כל משך הטיפול.",
      },
      {
        id: "consent_lash_lift_duration",
        label:
          "אני מודעת לכך שתוצאות הטיפול נשמרות בין 6–8 שבועות ולעיתים אף יותר, בהתאם לקצב הצמיחה האישי של הריסים.",
      },
      {
        id: "consent_follow_aftercare",
        label:
          "אני מבינה כי עליי לפעול בהתאם להנחיות לאחר טיפול הרמת ריסים, וכי שמירה עליהן משפיעה על תוצאות הטיפול.",
      },
      {
        id: "consent_professional_standards",
        label:
          "אני מבינה כי הטיפול מבוצע בהתאם לסטנדרטים מקצועיים מקובלים, וכי התוצאה הסופית עשויה להשתנות בין אדם לאדם בהתאם למבנה הריסים ולתגובה אישית.",
      },
      {
        id: "consent_result_not_guaranteed",
        label:
          "אני מבינה כי אין התחייבות לתוצאה אחידה או קבועה, וכי התוצאות עשויות להשתנות בין מטופלות.",
      },
      {
        id: "consent_no_claim_if_protocol_followed",
        label:
          "אני מאשרת כי קיבלתי הסבר מלא על הטיפול ותוצאותיו האפשריות, וכי לא תהיה לי טענה כלפי המטפלת כל עוד הטיפול בוצע בהתאם לנהלים ולהנחיות המקצועיות המקובלות.",
      },
      {
        id: "consent_details_correct",
        label:
          "אני מצהירה כי כל הפרטים והמידע שנמסרו על ידי במסגרת טופס זה הינם נכונים, מלאים ומעודכנים, וכי לא הושמט כל מידע מהותי.",
      },
    ],
  },
  browLiftFull: {
    title: "טופס הצהרת בריאות והסכמה לטיפול – הרמת גבות",
    intro: DEFAULT_FORM_INTRO,
    medicalOptions: [
      {
        id: "allergy_cosmetic",
        label: "האם ידועות לך רגישויות / אלרגיות כלשהן (כולל לחומרים קוסמטיים)?",
        allowDetails: true,
      },
      {
        id: "skin_medication_recent",
        label:
          "האם את משתמשת ברואקוטן / סטרואידים / תרופות המשפיעות על העור ב־6–12 החודשים האחרונים ?",
        allowDetails: true,
      },
      {
        id: "active_irritation_face_1",
        label: "האם קיימים פצעים, חתכים, אקנה פעיל, גירוי, אדמומיות, יובש או דלקת באזור הטיפול?",
        allowDetails: true,
      },
      {
        id: "active_ingredients_face",
        label: "האם את משתמשת בתכשירי פנים המכילים חומרים פעילים (כגון רטינול / חומצות / פילינגים)?",
        allowDetails: true,
      },
      {
        id: "skin_diseases_face",
        label: "האם יש לך מחלות עור (כגון פסוריאזיס / אקזמה / דרמטיטיס)?",
        allowDetails: true,
      },
      {
        id: "recent_facial_treatment",
        label: "האם עשית טיפול פנים/אסטתי במהלך השבוע האחרון?",
        allowDetails: true,
      },
      {
        id: "active_irritation_face_2",
        label: "האם קיימים פצעים, חתכים, אקנה פעיל, גירוי, אדמומיות, יובש או דלקת באזור הטיפול?",
        allowDetails: true,
      },
      {
        id: "pregnant_hormonal",
        label: "האם את בהריון / מניקה / נוטלת תרופות הורמונליות?",
        allowDetails: true,
      },
      { id: HEALTH_NONE_ID, label: "ללא" },
    ],
    consentTitle: "הצהרה ואישור טיפול",
    consentOptions: [
      ...buildSharedConsentOptions(),
      {
        id: "consent_brow_lift_treatment",
        label: "אני מאשרת לנטשה לבצע בי טיפול הרמת גבות.",
      },
      {
        id: "consent_brow_lift_duration",
        label:
          "אני מודעת לכך שתוצאות הטיפול נשמרות 4-6 שבועות ולעיתים אף יותר, בהתאם לקצב הצמיחה האישי של השיער שלנו.",
      },
      {
        id: "consent_brow_lift_methods",
        label:
          "ידוע לי כי הטיפול עשוי לכלול שימוש בחוט / שעווה / פינצטה  בהתאם לצורך ולשיקול דעת מקצועי.",
      },
      {
        id: "consent_brow_lift_final_result",
        label: "אני מבינה כי התוצאה הסופית תלויה במבנה הגבות הטבעי, מצב העור ותגובתי האישית לטיפול.",
      },
      {
        id: "consent_result_not_guaranteed",
        label: "אני מבינה כי אין התחייבות לתוצאה אחידה או קבועה, וכי תוצאות עשויות להשתנות בין מטופלות.",
      },
      {
        id: "consent_follow_aftercare",
        label: "אני מבינה כי עליי לפעול בהתאם להנחיות לאחר הטיפול, וכי שמירה עליהן משפיעה על תוצאות הטיפול.",
      },
      {
        id: "consent_no_claim_if_protocol_followed",
        label:
          "אני מאשרת כי קיבלתי הסבר מלא על הטיפול ותוצאותיו האפשריות, וכי לא תהיה לי כל טענה כלפי המטפלת כל עוד הטיפול בוצע בהתאם לנהלים ולהנחיות המקצועיות המקובלות.",
      },
      {
        id: "consent_details_correct",
        label:
          "אני מצהירה כי כל הפרטים והמידע שנמסרו על ידי במסגרת טופס זה הינם נכונים, מלאים ומעודכנים, וכי לא הושמט כל מידע מהותי.",
      },
    ],
  },
  lashBrowLift: {
    title: "טופס הצהרת בריאות והסכמה לטיפול – הרמת ריסים / הרמת גבות",
    intro: DEFAULT_FORM_INTRO,
    medicalOptions: [
      {
        id: "allergy_cosmetic",
        label: "האם ידועות לך רגישויות / אלרגיות כלשהן (כולל לחומרים קוסמטיים)?",
        allowDetails: true,
      },
      {
        id: "contact_lenses_or_drops",
        label: "האם את מרכיבה עדשות מגע או משתמשת בטיפות עיניים כרגע?",
        allowDetails: true,
      },
      {
        id: "pregnant_hormonal",
        label: "האם את בהריון / מניקה / נוטלת תרופות הורמונליות?",
        allowDetails: true,
      },
      {
        id: "recent_eye_surgery",
        label: "האם עברת ניתוח בעיניים (לייזר / קטרקט) במהלך 3 החודשים האחרונים?",
        allowDetails: true,
      },
      {
        id: "skin_medication_recent",
        label: "האם את משתמשת ברואקוטן / סטרואידים / תרופות המשפיעות על העור ב־6–12 החודשים האחרונים?",
        allowDetails: true,
      },
      {
        id: "active_ingredients_face",
        label: "האם את משתמשת בתכשירי פנים המכילים חומרים פעילים (כגון רטינול / חומצות / פילינגים)?",
        allowDetails: true,
      },
      {
        id: "skin_diseases_face",
        label: "האם יש לך מחלות עור (כגון פסוריאזיס / אקזמה / דרמטיטיס)?",
        allowDetails: true,
      },
      {
        id: "recent_facial_treatment",
        label: "האם עשית טיפול פנים/אסטתי במהלך השבוע האחרון?",
        allowDetails: true,
      },
      {
        id: "active_irritation_face",
        label: "האם קיימים פצעים, חתכים, אקנה פעיל, גירוי, אדמומיות, יובש או דלקת באזור הטיפול?",
        allowDetails: true,
      },
      { id: HEALTH_NONE_ID, label: "ללא" },
    ],
    consentTitle: "הצהרה ואישור טיפול",
    consentOptions: [
      ...buildSharedConsentOptions(),
      {
        id: "consent_combined_treatment",
        label: "אני מאשרת לנטשה לבצע בי את הטיפול/ים שסומנו לעיל.",
      },
      {
        id: "consent_brow_lift_methods",
        label:
          "ידוע לי כי הטיפול עשוי לכלול שימוש בחוט / שעווה / פינצטה  בהתאם לצורך ולשיקול דעת מקצועי.",
      },
      {
        id: "consent_lash_lift_closed_eyes",
        label: "אני מודעת לכך שעליי להיות עם עיניים עצומות במהלך טיפול הרמת ריסים.",
      },
      {
        id: "consent_combined_cosmetics",
        label: "אני מודעת לכך שהטיפול מתבצע באזור העיניים / הפנים ועשוי לכלול שימוש בחומרים קוסמטיים בהתאם לצורך.",
      },
      {
        id: "consent_combined_duration",
        label:
          "אני מודעת לכך שתוצאות הטיפול נשמרות בריסים בין 6–8 שבועות ובגבות 4-6 שבועות ולעיתים אף יותר, בהתאם לקצב הצמיחה האישי של השיער שלנו.",
      },
      {
        id: "consent_combined_final_result",
        label: "אני מבינה כי התוצאה הסופית תלויה במבנה הריסים / הגבות הטבעי, מצב העור ותגובתי האישית לטיפול.",
      },
      {
        id: "consent_follow_aftercare",
        label: "אני מבינה כי עליי לפעול בהתאם להנחיות לאחר הטיפול, וכי שמירה עליהן משפיעה על תוצאות הטיפול.",
      },
      {
        id: "consent_result_not_guaranteed",
        label: "אני מבינה כי אין התחייבות לתוצאה אחידה או קבועה, וכי התוצאות עשויות להשתנות בין מטופלות.",
      },
      {
        id: "consent_no_claim_if_protocol_followed",
        label:
          "אני מאשרת כי קיבלתי הסבר מלא על הטיפול ותוצאותיו האפשריות, וכי לא תהיה לי טענה כלפי המטפלת כל עוד הטיפול בוצע בהתאם לנהלים ולהנחיות המקצועיות המקובלות.",
      },
      {
        id: "consent_details_correct",
        label:
          "אני מצהירה כי כל הפרטים והמידע שנמסרו על ידי במסגרת טופס זה הינם נכונים, מלאים ומעודכנים, וכי לא הושמט כל מידע מהותי.",
      },
    ],
  },
  browShape: BROW_SHAPE_FORM,
  browMustache: BROW_SHAPE_FORM,
  lashLiftBrowShape: {
    title: "טופס הצהרת בריאות והסכמה לטיפול – הרמת ריסים / עיצוב גבות",
    intro: DEFAULT_FORM_INTRO,
    medicalOptions: [
      {
        id: "allergy_wax_dye",
        label: "האם ידועות לך רגישויות / אלרגיות כלשהן (כולל לחומרים קוסמטיים, שעווה או צבעים)?",
        allowDetails: true,
      },
      {
        id: "contact_lenses_or_drops",
        label: "האם את מרכיבה עדשות מגע או משתמשת בטיפות עיניים כרגע?",
        allowDetails: true,
      },
      {
        id: "pregnant_hormonal",
        label: "האם את בהריון / מניקה / נוטלת תרופות הורמונליות?",
        allowDetails: true,
      },
      {
        id: "recent_eye_surgery",
        label: "האם עברת ניתוח בעיניים (לייזר / קטרקט) במהלך 3 החודשים האחרונים?",
        allowDetails: true,
      },
      {
        id: "roaccutane_recent",
        label: "האם נטלת / נוטלת רואקוטן ב־6–12 החודשים האחרונים?",
        allowDetails: true,
      },
      {
        id: "blood_thinners",
        label: "האם את נוטלת תרופות מדללות דם (כגון אספירין / קומדין / אליקוויס)?",
        allowDetails: true,
      },
      {
        id: "active_ingredients_face",
        label: "האם את משתמשת באופן קבוע בתכשירים המכילים חומצות, רטינול או חומרים פעילים באזור הפנים?",
        allowDetails: true,
      },
      {
        id: "skin_diseases_face",
        label: "האם יש לך מחלות עור (כגון פסוריאזיס / אקזמה / דרמטיטיס)?",
        allowDetails: true,
      },
      {
        id: "recent_peeling_laser",
        label: "האם עברת פילינג כימי / טיפול לייזר / טיפול אסתטי באזור הפנים בשבועיים האחרונים?",
        allowDetails: true,
      },
      {
        id: "active_irritation_face",
        label: "האם קיימים פצעים, חתכים, אקנה פעיל, גירוי, אדמומיות, יובש או דלקת באזור הטיפול?",
        allowDetails: true,
      },
      { id: HEALTH_NONE_ID, label: "ללא" },
    ],
    consentTitle: "הצהרה ואישור טיפול",
    consentOptions: [
      ...buildSharedConsentOptions(),
      {
        id: "consent_combined_treatment",
        label: "אני מאשרת לנטשה לבצע בי את הטיפול/ים שסומנו לעיל.",
      },
      {
        id: "consent_brow_lift_methods",
        label: "ידוע לי כי הטיפול עשוי לכלול שימוש בחוט / שעווה / פינצטה בהתאם לצורך ולשיקול דעת מקצועי.",
      },
      {
        id: "consent_brow_shape_temporary_reactions",
        label: "ידוע לי כי ייתכנו תגובות זמניות לאחר הטיפול, כגון אדמומיות קלה, רגישות או גירוי בעור.",
      },
      {
        id: "consent_lash_lift_closed_eyes",
        label: "אני מודעת לכך שעליי להיות עם עיניים עצומות במהלך טיפול הרמת ריסים.",
      },
      {
        id: "consent_lash_lift_duration",
        label:
          "אני מודעת לכך שתוצאות הטיפול נשמרות בין 6–8 שבועות ולעיתים אף יותר, בהתאם לקצב הצמיחה האישי של הריסים.",
      },
      {
        id: "consent_follow_aftercare",
        label:
          "אני מבינה כי עליי לפעול בהתאם להנחיות לאחר טיפול הרמת ריסים, וכי שמירה עליהן משפיעה על תוצאות הטיפול.",
      },
      {
        id: "consent_result_not_guaranteed",
        label: "אני מבינה כי אין התחייבות לתוצאה אחידה או קבועה, וכי התוצאות עשויות להשתנות בין מטופלות.",
      },
      {
        id: "consent_no_claim_if_protocol_followed",
        label:
          "אני מאשרת כי קיבלתי הסבר מלא על הטיפול ותוצאותיו האפשריות, וכי לא תהיה לי טענה כלפי המטפלת כל עוד הטיפול בוצע בהתאם לנהלים ולהנחיות המקצועיות המקובלות.",
      },
      {
        id: "consent_details_correct",
        label:
          "אני מצהירה כי כל הפרטים והמידע שנמסרו על ידי במסגרת טופס זה הינם נכונים, מלאים ומעודכנים, וכי לא הושמט כל מידע מהותי.",
      },
    ],
  },
};

export const HEALTH_ITEM_LABELS: Record<string, string> = Object.values(
  SERVICE_HEALTH_FORMS,
).reduce<Record<string, string>>((acc, form) => {
  for (const item of [...form.medicalOptions, ...form.consentOptions]) {
    acc[item.id] = item.label;
  }
  return acc;
}, {});
