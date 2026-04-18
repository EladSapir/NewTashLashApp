"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  availableDates: string[]; // "YYYY-MM-DD"
  selectedDate: string;
  onSelect: (date: string) => void;
  /** Optional min date (defaults to today) */
  minDate?: Date;
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toKey(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function MonthlyCalendar({
  availableDates,
  selectedDate,
  onSelect,
  minDate,
}: Props) {
  const t = useTranslations("calendar");

  const today = useMemo(() => startOfDay(new Date()), []);
  const min = useMemo(() => (minDate ? startOfDay(minDate) : today), [minDate, today]);

  const availableSet = useMemo(() => new Set(availableDates), [availableDates]);

  // Start cursor at the first month that has any available date (or current month)
  const initialCursor = useMemo(() => {
    if (availableDates.length === 0) return startOfMonth(today);
    const first = availableDates
      .slice()
      .sort((a, b) => a.localeCompare(b))
      .find((d) => d >= toKey(today));
    if (!first) return startOfMonth(today);
    const [y, m] = first.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }, [availableDates, today]);

  const [cursor, setCursor] = useState<Date>(initialCursor);

  const weekdays = t.raw("weekdays") as string[];
  const months = t.raw("months") as string[];

  // Build 6-week grid for the month
  const grid = useMemo(() => {
    const first = startOfMonth(cursor);
    const firstWeekday = first.getDay(); // 0=Sun
    const startDate = new Date(first);
    startDate.setDate(first.getDate() - firstWeekday);

    const cells: Date[] = [];
    for (let i = 0; i < 42; i += 1) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      cells.push(d);
    }
    return cells;
  }, [cursor]);

  const monthKey = `${cursor.getFullYear()}-${cursor.getMonth()}`;

  const goPrev = () => {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  };
  const goNext = () => {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  };

  const canGoPrev = (() => {
    const endOfPrev = new Date(cursor.getFullYear(), cursor.getMonth(), 0);
    return endOfPrev >= min;
  })();

  return (
    <div className="rounded-2xl border border-mauve/20 bg-white/80 p-3 shadow-soft backdrop-blur">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={goNext}
          aria-label={t("next")}
          className="grid h-8 w-8 place-items-center rounded-full border border-mauve/25 text-mauve transition hover:bg-mauve/10"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="font-display text-base font-semibold text-burgundy">
          {months[cursor.getMonth()]} {cursor.getFullYear()}
        </div>
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
          aria-label={t("prev")}
          className="grid h-8 w-8 place-items-center rounded-full border border-mauve/25 text-mauve transition hover:bg-mauve/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday row */}
      <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold text-ink/50">
        {weekdays.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      {/* Grid with animation on month change */}
      <AnimatePresence mode="wait">
        <motion.div
          key={monthKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="grid grid-cols-7 gap-1"
        >
          {grid.map((date, i) => {
            const key = toKey(date);
            const inMonth = date.getMonth() === cursor.getMonth();
            const isPast = date < min;
            const isAvailable = inMonth && !isPast && availableSet.has(key);
            const isSelected = key === selectedDate;
            const isToday = key === toKey(today);

            const base =
              "relative aspect-square rounded-xl text-sm font-medium transition select-none";
            let cls: string;
            if (!inMonth) {
              cls = "text-ink/20 pointer-events-none";
            } else if (isAvailable) {
              cls = isSelected
                ? "bg-burgundy text-white shadow-soft"
                : "bg-blush/70 text-burgundy hover:bg-rose hover:text-white";
            } else {
              cls = "text-ink/25 cursor-not-allowed";
            }

            return (
              <button
                key={`${key}-${i}`}
                type="button"
                disabled={!isAvailable}
                onClick={() => isAvailable && onSelect(key)}
                className={`${base} ${cls}`}
                aria-label={date.toLocaleDateString("he-IL")}
              >
                <span
                  className={`absolute inset-0 grid place-items-center ${
                    isToday && !isSelected ? "ring-1 ring-mauve/60 rounded-xl" : ""
                  }`}
                >
                  {date.getDate()}
                </span>
                {isAvailable && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-mauve" />
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-1 text-[11px] text-ink/60">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blush border border-mauve/30" />
          זמין
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-burgundy" />
          נבחר
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
          לא זמין
        </span>
      </div>
    </div>
  );
}
