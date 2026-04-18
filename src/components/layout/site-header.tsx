"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Sparkles } from "lucide-react";
import { InstagramIcon } from "@/components/ui/icons";
import { useTranslations } from "next-intl";

export function SiteHeader() {
  const t = useTranslations("common");
  const pathname = usePathname() ?? "";

  // Homepage paths: "/", "/he", "/he/", "/en", etc.
  const isHome = /^\/([a-z]{2})?\/?$/.test(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-mauve/15 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <Link
          href="/he"
          className="flex items-center gap-2 transition hover:opacity-80"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-rose to-mauve text-white shadow-soft">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-display text-sm font-semibold text-burgundy">
            {t("brand")}
          </span>
        </Link>

        {!isHome && (
          <div className="flex items-center gap-2">
            <a
              href="http://wa.me/972526043268"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-emerald-700"
              aria-label={t("whatsappCta")}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">{t("whatsappCta")}</span>
            </a>
            <a
              href="https://www.instagram.com/tash.lashes1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-mauve/40 bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-mauve"
              aria-label="Instagram"
            >
              <InstagramIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Instagram</span>
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
