import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/layout/site-header";

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

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div
        dir={locale === "he" ? "rtl" : "ltr"}
        lang={locale}
        className="relative min-h-screen bg-cream"
      >
        <SiteHeader />
        <main className="w-full pb-16 pt-4">{children}</main>
        <footer className="mt-8 border-t border-mauve/15 bg-white/60 py-6 text-center text-xs text-ink/60 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4">
            © {new Date().getFullYear()} {common("brand")} · {common("footerNote")}
          </div>
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
