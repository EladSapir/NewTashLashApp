"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

type Props = {
  message: string;
  visible: boolean;
};

export function SuccessPopup({ message, visible }: Props) {
  const [open, setOpen] = useState(visible);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(visible);
    if (!visible) return;
    const timeout = setTimeout(() => setOpen(false), 5000);
    return () => clearTimeout(timeout);
  }, [visible]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex min-h-0 items-center justify-center bg-burgundy/30 px-4 py-4 backdrop-blur-sm"
          style={{ top: 0, left: 0, right: 0, bottom: 0, height: "100dvh" }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 250, damping: 22 }}
            className="w-full max-w-sm rounded-card border border-mauve/20 bg-white p-6 text-center shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold text-ink">{message}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
