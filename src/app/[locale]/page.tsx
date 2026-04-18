import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, MessageCircle, Sparkles } from "lucide-react";
import { SuccessPopup } from "@/components/ui/success-popup";
import { InstagramIcon } from "@/components/ui/icons";
import { SERVICE_IDS } from "@/lib/constants";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const common = await getTranslations("common");
  const booking = await getTranslations("booking");
  const services = await getTranslations("services");
  const { success } = await searchParams;

  return (
    <div className="space-y-10">
      <SuccessPopup message={booking("success")} visible={success === "1"} />

      {/* HERO */}
      <section className="relative -mt-6 overflow-hidden rounded-b-[3rem] bg-rose-sheen">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,98,107,0.25),transparent_65%)]" />
        </div>

        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-4 pb-10 pt-4 text-center md:flex-row-reverse md:items-center md:gap-8 md:pb-16 md:pt-8 md:text-right">
          <div className="relative mx-auto w-72 shrink-0 md:w-96">
            <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-rose/60 via-mauve/40 to-burgundy/40 blur-3xl" />
            <Image
              src="/tash-hero.jpeg"
              alt={common("brand")}
              width={900}
              height={1050}
              priority
              className="h-auto w-full mix-blend-multiply drop-shadow-[0_25px_40px_rgba(126,62,72,0.35)]"
            />
          </div>

          <div className="mt-6 flex-1 md:mt-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-mauve/30 bg-white/60 px-3 py-1 text-xs font-medium text-mauve backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              {common("tagline")}
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-burgundy md:text-5xl">
              {common("brand")}
            </h1>
            <p className="mx-auto mt-4 max-w-md whitespace-pre-line text-sm leading-relaxed text-ink/75 md:mx-0 md:text-base">
              {common("homeSubtitle")}
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <Link
                href="/he/booking"
                className="inline-flex items-center gap-2 rounded-full bg-burgundy px-6 py-3 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-mauve"
              >
                <Sparkles className="h-4 w-4" />
                {common("bookNow")}
              </Link>
              <a
                href="http://wa.me/972526043268"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                <MessageCircle className="h-4 w-4" />
                {common("whatsappCta")}
              </a>
              <a
                href="https://www.instagram.com/tash.lashes1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-mauve/40 bg-white/80 px-5 py-3 text-sm font-bold text-ink backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
              >
                <InstagramIcon className="h-4 w-4" />
                Instagram
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto w-full max-w-5xl px-4">
        <div className="mb-5">
          <h2 className="font-display text-2xl font-bold text-burgundy">
            {common("ourServices")}
          </h2>
          <p className="text-sm text-ink/60">{common("servicesIntro")}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SERVICE_IDS.map((key) => (
            <Link
              key={key}
              href={`/he/booking?service=${key}`}
              className="group relative overflow-hidden rounded-card border border-mauve/15 bg-white/85 p-5 shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:border-mauve/40"
            >
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-rose/30 to-mauve/10 transition group-hover:scale-110" />
              <div className="relative flex items-center justify-between gap-3">
                <h3 className="font-display text-lg font-semibold text-ink">
                  {services(key)}
                </h3>
                <ArrowLeft className="h-4 w-4 shrink-0 text-mauve transition group-hover:-translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
