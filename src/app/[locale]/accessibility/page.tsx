import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "הצהרת נגישות · Tash Lashes",
  description: "הצהרת נגישות לאתר של Tash Lashes לפי תקן ישראלי 5568 ברמת AA.",
};

/**
 * Accessibility statement — required by Israeli accessibility regulations
 * (Equal Rights for Persons with Disabilities Regulations, 2013) for any
 * public-facing business website. The page describes how IS 5568 (WCAG 2.0
 * level AA) is applied, known limitations and how to contact the
 * accessibility coordinator.
 */
export default async function AccessibilityPage() {
  const t = await getTranslations("accessibility.statement");

  const sections = [
    { title: t("commitmentTitle"), body: t("commitmentBody") },
    { title: t("howTitle"), body: t("howBody") },
    { title: t("featuresTitle"), body: t("featuresBody") },
    { title: t("limitationsTitle"), body: t("limitationsBody") },
    { title: t("parkingTitle"), body: t("parkingBody") },
    { title: t("contactTitle"), body: t("contactBody") },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4" dir="rtl">
      <header className="rounded-card bg-gradient-to-br from-burgundy to-mauve p-6 text-white shadow-soft">
        <h1 className="font-display text-2xl font-bold">{t("heading")}</h1>
        <p className="mt-2 text-sm opacity-90">{t("lead")}</p>
      </header>

      <article className="rounded-card border border-mauve/15 bg-white/90 p-6 shadow-soft backdrop-blur">
        <div className="space-y-6 text-sm leading-relaxed text-ink/90">
          {sections.map((section) => (
            <section key={section.title} className="space-y-2">
              <h2 className="font-display text-lg font-bold text-burgundy">
                {section.title}
              </h2>
              <p className="whitespace-pre-line">{section.body}</p>
            </section>
          ))}
          <p className="text-xs text-ink/50">
            {t("lastUpdated", {
              date: new Date().toLocaleDateString("he-IL", {
                timeZone: "Asia/Jerusalem",
              }),
            })}
          </p>
        </div>
      </article>
    </div>
  );
}
