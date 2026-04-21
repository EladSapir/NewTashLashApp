"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Accessibility,
  Contrast,
  Droplet,
  Link as LinkIcon,
  Mail,
  MousePointerClick,
  Pause,
  RotateCcw,
  Type,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Client-side accessibility toolbar designed to meet the core
 * requirements of Israeli Standard 5568 (IS 5568) and the
 * Equal Rights for Persons with Disabilities Regulations (2013):
 * - Text resizing (up to 200%)
 * - High contrast + monochrome themes
 * - Highlighted links & clickable areas
 * - Stop animations / motion
 * - Readable (sans) font
 * - Keyboard focus indicators (always on via CSS)
 * - Persistent preferences via localStorage
 * - Accessibility statement link
 */

type A11yState = {
  fontScale: number; // 1.0 = 100%
  highContrast: boolean;
  monochrome: boolean;
  highlightLinks: boolean;
  highlightTargets: boolean;
  readableFont: boolean;
  stopAnimations: boolean;
};

const STORAGE_KEY = "tashlashes.a11y";

const DEFAULT_STATE: A11yState = {
  fontScale: 1,
  highContrast: false,
  monochrome: false,
  highlightLinks: false,
  highlightTargets: false,
  readableFont: false,
  stopAnimations: false,
};

const MIN_SCALE = 0.9;
const MAX_SCALE = 2.0;
const STEP = 0.1;

function applyToDocument(state: A11yState) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--a11y-font-scale", String(state.fontScale));
  root.classList.toggle("a11y-high-contrast", state.highContrast);
  root.classList.toggle("a11y-monochrome", state.monochrome);
  root.classList.toggle("a11y-highlight-links", state.highlightLinks);
  root.classList.toggle("a11y-highlight-targets", state.highlightTargets);
  root.classList.toggle("a11y-readable-font", state.readableFont);
  root.classList.toggle("a11y-stop-animations", state.stopAnimations);
}

function loadState(): A11yState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<A11yState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

export function AccessibilityMenu() {
  const t = useTranslations("accessibility");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<A11yState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    applyToDocument(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applyToDocument(state);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }, [state, hydrated]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const setBool = (key: keyof A11yState) => (value: boolean) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const changeScale = (delta: number) => {
    setState((prev) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.fontScale + delta));
      return { ...prev, fontScale: Math.round(next * 10) / 10 };
    });
  };

  const reset = () => {
    setState(DEFAULT_STATE);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="a11y-panel"
        aria-label={t("toggle")}
        className="fixed bottom-4 left-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-burgundy text-white shadow-soft transition hover:bg-mauve focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy focus-visible:ring-offset-2"
      >
        <Accessibility className="h-6 w-6" aria-hidden />
      </button>

      {open ? (
        <div
          id="a11y-panel"
          role="dialog"
          aria-modal="false"
          aria-label={t("title")}
          className="fixed bottom-20 left-4 z-40 w-[19.5rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-mauve/25 bg-white p-4 text-ink shadow-soft"
          dir="rtl"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-burgundy">
              {t("title")}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("close")}
              className="rounded-full p-1 text-ink/60 transition hover:bg-mauve/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="rounded-xl border border-mauve/20 bg-blush/20 p-3">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <Type className="h-4 w-4" aria-hidden />
                {t("fontSize")}
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => changeScale(-STEP)}
                  disabled={state.fontScale <= MIN_SCALE + 0.001}
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-mauve/30 px-3 font-bold transition hover:bg-mauve/10 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy"
                  aria-label={t("decrease")}
                >
                  −
                </button>
                <span className="text-xs font-semibold text-ink/70" aria-live="polite">
                  {Math.round(state.fontScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => changeScale(STEP)}
                  disabled={state.fontScale >= MAX_SCALE - 0.001}
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-mauve/30 px-3 font-bold transition hover:bg-mauve/10 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy"
                  aria-label={t("increase")}
                >
                  +
                </button>
              </div>
            </div>

            <ToggleRow
              icon={<Contrast className="h-4 w-4" aria-hidden />}
              label={t("highContrast")}
              checked={state.highContrast}
              onChange={setBool("highContrast")}
            />
            <ToggleRow
              icon={<Droplet className="h-4 w-4" aria-hidden />}
              label={t("monochrome")}
              checked={state.monochrome}
              onChange={setBool("monochrome")}
            />
            <ToggleRow
              icon={<LinkIcon className="h-4 w-4" aria-hidden />}
              label={t("highlightLinks")}
              checked={state.highlightLinks}
              onChange={setBool("highlightLinks")}
            />
            <ToggleRow
              icon={<MousePointerClick className="h-4 w-4" aria-hidden />}
              label={t("highlightTargets")}
              checked={state.highlightTargets}
              onChange={setBool("highlightTargets")}
            />
            <ToggleRow
              icon={<Type className="h-4 w-4" aria-hidden />}
              label={t("readableFont")}
              checked={state.readableFont}
              onChange={setBool("readableFont")}
            />
            <ToggleRow
              icon={<Pause className="h-4 w-4" aria-hidden />}
              label={t("stopAnimations")}
              checked={state.stopAnimations}
              onChange={setBool("stopAnimations")}
            />

            <a
              href={`mailto:${common("emailAddress")}`}
              aria-label={`${common("emailLabel")}: ${common("emailAddress")}`}
              className="flex items-center gap-2 rounded-xl border border-mauve/20 bg-blush/20 px-3 py-2 text-xs font-semibold text-ink transition hover:border-mauve focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy"
            >
              <Mail className="h-4 w-4 shrink-0 text-burgundy" aria-hidden />
              <span className="min-w-0 break-all">{common("emailAddress")}</span>
            </a>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1 rounded-full border border-mauve/30 px-3 py-1.5 text-xs font-semibold transition hover:bg-mauve/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy"
              >
                <RotateCcw className="h-3 w-3" aria-hidden />
                {t("reset")}
              </button>
              <Link
                href="/he/accessibility"
                className="text-xs font-semibold text-burgundy underline hover:text-mauve focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy"
              >
                {t("statementLink")}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-mauve/20 bg-white px-3 py-2 text-sm transition hover:border-mauve">
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-burgundy"
      />
    </label>
  );
}
