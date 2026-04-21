import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/layout/site-header";
import { AccessibilityMenu } from "@/components/ui/accessibility-menu";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const messages = await getMessages();
  const common = await getTranslations("common");
  const a11y = await getTranslations("accessibility");

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div
        dir={locale === "he" ? "rtl" : "ltr"}
        lang={locale}
        className="relative min-h-screen bg-cream"
      >
        <a href="#main-content" className="skip-to-content">
          {a11y("skipToContent")}
        </a>
        <SiteHeader />
        <main id="main-content" className="w-full pb-16 pt-4">
          {children}
        </main>
        <footer className="mt-8 border-t border-mauve/15 bg-white/60 py-6 text-center text-xs text-ink/60 backdrop-blur">
          <div className="mx-auto max-w-5xl space-y-2 px-4">
            <p>
              © {new Date().getFullYear()} {common("brand")} ·{" "}
              {common("footerNote")}
            </p>
            <p>
              <a
                href={`/${locale}/accessibility`}
                className="underline hover:text-burgundy"
              >
                {a11y("statementLink")}
              </a>
            </p>
          </div>
        </footer>
        <AccessibilityMenu />
      </div>
    </NextIntlClientProvider>
  );
}
