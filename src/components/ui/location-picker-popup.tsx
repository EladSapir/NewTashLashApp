"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Sparkles, X } from "lucide-react";
import { Location } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (location: Location) => void;
};

/**
 * Cute studio picker popup. Rendered in a portal so it can sit above
 * any sticky header. The two studio choices are visually different on
 * purpose so the customer can tell them apart at a glance.
 */
export function LocationPickerPopup({ open, onClose, onSelect }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll while the popup is open.
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // Close on Escape so keyboard users can dismiss it.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          dir="rtl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-burgundy/40 px-4 backdrop-blur-md"
          style={{ height: "100dvh" }}
          onClick={onClose}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            key="card"
            initial={{ scale: 0.92, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 6 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="relative w-full max-w-md overflow-hidden rounded-card border border-mauve/20 bg-white shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="סגירה"
              className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-mauve/25 text-mauve transition hover:bg-mauve/10"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="bg-gradient-to-br from-rose/40 via-blush/60 to-white px-6 pb-4 pt-7 text-center">
              <div className="mx-auto mb-2 inline-flex items-center gap-1.5 rounded-full border border-mauve/30 bg-white/70 px-3 py-1 text-[11px] font-semibold text-mauve">
                <Sparkles className="h-3.5 w-3.5" />
                בחירת סטודיו
              </div>
              <h2 className="font-display text-2xl font-bold text-burgundy">
                באיזה סטודיו נפגש?
              </h2>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <StudioButton
                city="אשדוד"
                subtitle="כנרת 71, אשדוד"
                gradient="from-rose to-burgundy"
                onClick={() => onSelect("ashdod")}
              />
              <StudioButton
                city="תל אביב"
                subtitle="שינקין 56 (קוסמוס), תל אביב"
                gradient="from-mauve to-ink"
                onClick={() => onSelect("tel_aviv")}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function StudioButton({
  city,
  subtitle,
  gradient,
  onClick,
}: {
  city: string;
  subtitle: string;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-32 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} px-4 text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-md`}
    >
      <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/15 transition group-hover:scale-110" />
      <span className="relative grid h-9 w-9 place-items-center rounded-full bg-white/20">
        <MapPin className="h-5 w-5" />
      </span>
      <span className="relative font-display text-xl font-bold">{city}</span>
      <span className="relative text-[11px] font-medium text-white/85">
        {subtitle}
      </span>
    </button>
  );
}
