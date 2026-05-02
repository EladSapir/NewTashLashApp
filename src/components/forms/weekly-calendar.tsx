"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { BookingRequest } from "@/lib/types";
import { LocationBadge } from "@/components/forms/slot-manager";
import { ISRAEL_TIME_ZONE } from "@/lib/timezone";

/**
 * Returns the YYYY-MM-DD wall-clock date in Israel for the given UTC
 * instant, decomposed so we can rebuild week boundaries from it.
 */
function israelDateParts(utc: Date) {
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone: ISRAEL_TIME_ZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dtf.formatToParts(utc);
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? "";
  const weekdayShort = get("weekday"); // "Sun", "Mon", ...
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekdayShort,
  };
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Builds the UTC instant that matches `year-month-day 00:00` in Israel
 * local time. Handles IST/IDT correctly so weeks that contain a DST
 * transition still render with seven distinct calendar days.
 */
function israelMidnightToUtc(year: number, month: number, day: number): Date {
  const wallClockUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const offset = israelOffsetMinutes(wallClockUtc);
  let result = new Date(wallClockUtc.getTime() - offset * 60000);
  const verify = israelOffsetMinutes(result);
  if (verify !== offset) {
    result = new Date(wallClockUtc.getTime() - verify * 60000);
  }
  return result;
}

/**
 * Returns the UTC `Date` that represents Sunday 00:00 in Israel for the
 * week containing `utc`. Sunday is the first day of the week in Israel.
 */
function startOfIsraelWeek(utc: Date): Date {
  const { year, month, day, weekdayShort } = israelDateParts(utc);
  const dayOfWeek = WEEKDAY_INDEX[weekdayShort] ?? 0;
  return israelMidnightToUtc(year, month, day - dayOfWeek);
}

function israelOffsetMinutes(utc: Date): number {
  const dtf = new Intl.DateTimeFormat("en-GB", {
    timeZone: ISRAEL_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(utc);
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === t)?.value);
  const asIfUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return (asIfUtc - utc.getTime()) / 60000;
}

/**
 * Adds `days` Israel-calendar days to `utc`. Uses wall-clock arithmetic
 * (rather than `+ N * 24h`) so a DST-transition week still has 7 days.
 */
function addIsraelDays(utc: Date, days: number): Date {
  const { year, month, day } = israelDateParts(utc);
  return israelMidnightToUtc(year, month, day + days);
}

/**
 * Stable YYYY-MM-DD key in Israel time — used to bucket bookings into
 * the right day cell regardless of the runtime's default timezone.
 */
function israelDayKey(utc: Date): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: ISRAEL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dtf.format(utc);
}

/**
 * Admin-only weekly calendar card. Shows every day of a chosen week with
 * its pending + confirmed bookings. Available (open, no-booking) slots
 * are intentionally excluded — we only surface appointments that need
 * action or have already been booked. Optimised for one-handed mobile
 * use: a vertical day stack, large tap targets, and arrow buttons in
 * thumb-reach for week navigation.
 */
export function WeeklyCalendar() {
  const t = useTranslations("admin");
  const services = useTranslations("services");

  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfIsraelWeek(new Date()),
  );
  const [bookings, setBookings] = useState<BookingRequest[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const weekEnd = useMemo(() => addIsraelDays(weekStart, 7), [weekStart]);

  const todayWeekStart = useMemo(() => startOfIsraelWeek(new Date()), []);
  const isCurrentWeek = weekStart.getTime() === todayWeekStart.getTime();

  const todayKey = useMemo(() => israelDayKey(new Date()), []);

  const days = useMemo(() => {
    const result: { key: string; date: Date }[] = [];
    for (let i = 0; i < 7; i += 1) {
      const date = addIsraelDays(weekStart, i);
      result.push({ key: israelDayKey(date), date });
    }
    return result;
  }, [weekStart]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: weekStart.toISOString(),
        to: weekEnd.toISOString(),
      });
      const response = await fetch(`/api/admin/bookings?${params.toString()}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        bookings?: BookingRequest[];
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? t("loadError"));
        return;
      }
      setError("");
      setBookings(data.bookings ?? []);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [weekStart, weekEnd, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, BookingRequest[]>();
    if (!bookings) return map;
    for (const booking of bookings) {
      const key = israelDayKey(new Date(booking.startsAt));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(booking);
    }
    return map;
  }, [bookings]);

  const weekRangeLabel = useMemo(() => {
    const start = weekStart;
    const end = addIsraelDays(weekStart, 6);
    const startFmt = new Intl.DateTimeFormat("he-IL", {
      timeZone: ISRAEL_TIME_ZONE,
      day: "numeric",
      month: "short",
    }).format(start);
    const endFmt = new Intl.DateTimeFormat("he-IL", {
      timeZone: ISRAEL_TIME_ZONE,
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(end);
    return `${startFmt} – ${endFmt}`;
  }, [weekStart]);

  const goPrev = () => setWeekStart((current) => addIsraelDays(current, -7));
  const goNext = () => setWeekStart((current) => addIsraelDays(current, 7));
  const goToday = () => setWeekStart(todayWeekStart);

  return (
    <section className="rounded-card border border-mauve/15 bg-white/90 p-4 shadow-soft backdrop-blur sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-burgundy">
          <CalendarDays className="h-4 w-4" aria-hidden />
          {t("weeklyTitle")}
        </h2>
        {!isCurrentWeek ? (
          <button
            type="button"
            onClick={goToday}
            className="inline-flex items-center gap-1 rounded-full border border-mauve/30 px-3 py-1 text-xs font-semibold text-burgundy transition hover:bg-mauve/10"
          >
            <RotateCcw className="h-3 w-3" aria-hidden />
            {t("thisWeek")}
          </button>
        ) : (
          <span className="rounded-full border border-mauve/30 bg-mauve/10 px-3 py-1 text-[11px] font-semibold text-mauve">
            {t("thisWeek")}
          </span>
        )}
      </div>

      {/* Week navigation: arrows + range. Big tappable buttons for mobile.
          Layout matches the monthly calendar's convention: in RTL the
          right-most arrow (first child) advances to the next week, and
          the left-most arrow (last child) goes back. */}
      <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-mauve/20 bg-blush/30 p-1.5">
        <button
          type="button"
          onClick={goNext}
          aria-label={t("nextWeek")}
          className="grid h-10 w-10 place-items-center rounded-xl text-mauve transition hover:bg-white"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="flex flex-col items-center text-center leading-tight">
          <span className="text-[11px] font-medium uppercase tracking-wide text-mauve">
            {t("week")}
          </span>
          <span className="font-display text-sm font-semibold text-burgundy sm:text-base">
            {weekRangeLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={goPrev}
          aria-label={t("prevWeek")}
          className="grid h-10 w-10 place-items-center rounded-xl text-mauve transition hover:bg-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {error ? (
        <p
          role="alert"
          className="mb-3 rounded-xl border-2 border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        {days.map(({ key, date }) => {
          const items = grouped.get(key) ?? [];
          const isToday = key === todayKey;
          const dayName = new Intl.DateTimeFormat("he-IL", {
            timeZone: ISRAEL_TIME_ZONE,
            weekday: "long",
          }).format(date);
          const dayNumber = new Intl.DateTimeFormat("he-IL", {
            timeZone: ISRAEL_TIME_ZONE,
            day: "numeric",
            month: "numeric",
          }).format(date);
          return (
            <div
              key={key}
              className={`overflow-hidden rounded-2xl border ${
                isToday
                  ? "border-burgundy/50 bg-gradient-to-l from-rose/15 via-blush/20 to-white ring-1 ring-burgundy/30"
                  : items.length > 0
                    ? "border-mauve/25 bg-white"
                    : "border-mauve/15 bg-blush/10"
              }`}
            >
              <div
                className={`flex items-center justify-between gap-2 px-3 py-2 ${
                  isToday
                    ? "bg-gradient-to-l from-burgundy/10 to-mauve/5"
                    : "border-b border-mauve/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-bold ${
                      isToday
                        ? "bg-burgundy text-white shadow-soft"
                        : "bg-mauve/10 text-mauve"
                    }`}
                  >
                    {date.toLocaleDateString("he-IL", {
                      timeZone: ISRAEL_TIME_ZONE,
                      day: "numeric",
                    })}
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span className="font-display text-sm font-semibold text-burgundy">
                      {dayName}
                      {isToday ? (
                        <span className="mr-1.5 rounded-full bg-burgundy px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {t("today")}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[11px] text-ink/55">{dayNumber}</span>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    items.length === 0
                      ? "bg-ink/5 text-ink/45"
                      : "bg-mauve/15 text-mauve"
                  }`}
                >
                  {items.length === 0
                    ? t("noBookingsShort")
                    : t("bookingsCount", { count: items.length })}
                </span>
              </div>

              {items.length > 0 ? (
                <ul className="divide-y divide-mauve/10">
                  {items
                    .slice()
                    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
                    .map((booking) => {
                      const isPending = booking.status === "pending";
                      return (
                        <li
                          key={booking.id}
                          className="flex items-stretch gap-2 px-3 py-2 text-sm"
                        >
                          <div
                            className={`flex w-14 shrink-0 flex-col items-center justify-center rounded-xl px-1 py-1.5 text-center ${
                              isPending
                                ? "bg-amber-100 text-amber-900"
                                : "bg-emerald-100 text-emerald-900"
                            }`}
                          >
                            <span className="font-display text-base font-bold leading-none">
                              {new Date(booking.startsAt).toLocaleTimeString(
                                "he-IL",
                                {
                                  timeZone: ISRAEL_TIME_ZONE,
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                            <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold">
                              {isPending ? (
                                <Clock className="h-2.5 w-2.5" aria-hidden />
                              ) : (
                                <CheckCircle2 className="h-2.5 w-2.5" aria-hidden />
                              )}
                              {isPending
                                ? t("statusPending")
                                : t("statusConfirmed")}
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="truncate font-semibold text-ink">
                                {booking.fullName}
                              </span>
                              <LocationBadge location={booking.location} />
                            </div>
                            <span className="truncate text-xs text-ink/65">
                              {services(booking.serviceId)}
                            </span>
                            <a
                              href={`tel:${booking.phoneNumber}`}
                              className="truncate text-[11px] font-medium text-mauve underline-offset-2 hover:underline"
                            >
                              {booking.phoneNumber}
                            </a>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>

      {loading && bookings === null ? (
        <p className="mt-3 inline-flex items-center gap-2 rounded-xl border border-mauve/20 bg-blush/20 px-3 py-2 text-sm text-ink/70">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {t("loading")}
        </p>
      ) : null}
    </section>
  );
}
