"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CalendarX,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { BookingRequest } from "@/lib/types";

/**
 * Admin-only panel listing every future (upcoming) booking together
 * with approve + release actions:
 *   - approve: pending → confirmed (slots kept locked)
 *   - release: booking deleted + slots returned to `available`
 */
export function BookingsManager() {
  const t = useTranslations("admin");
  const services = useTranslations("services");
  const [bookings, setBookings] = useState<BookingRequest[] | null>(null);
  const [error, setError] = useState("");
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const loadBookings = async () => {
    try {
      const response = await fetch("/api/admin/bookings", { cache: "no-store" });
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
    }
  };

  useEffect(() => {
    void loadBookings();
  }, []);

  const grouped = useMemo(() => {
    if (!bookings) return [];
    const dayFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jerusalem",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const map = new Map<string, BookingRequest[]>();
    for (const booking of bookings) {
      const day = dayFormatter.format(new Date(booking.startsAt));
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(booking);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [bookings]);

  const onRelease = async (booking: BookingRequest) => {
    const confirmed = window.confirm(
      t("releaseConfirm", {
        name: booking.fullName,
        service: services(booking.serviceId),
        time: new Date(booking.startsAt).toLocaleString("he-IL", {
          timeZone: "Asia/Jerusalem",
        }),
      }),
    );
    if (!confirmed) return;

    setReleasingId(booking.id);
    try {
      const response = await fetch("/api/admin/bookings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? t("releaseError"));
        return;
      }
      setError("");
      await loadBookings();
    } catch {
      setError(t("releaseError"));
    } finally {
      setReleasingId(null);
    }
  };

  const onConfirm = async (booking: BookingRequest) => {
    setConfirmingId(booking.id);
    try {
      const response = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, action: "confirm" }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? t("confirmError"));
        return;
      }
      setError("");
      await loadBookings();
    } catch {
      setError(t("confirmError"));
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <section className="rounded-card border border-mauve/15 bg-white/90 p-5 shadow-soft backdrop-blur">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-burgundy">
          <CalendarX className="h-4 w-4" aria-hidden />
          {t("bookingsTitle")}
        </h2>
        <button
          type="button"
          onClick={loadBookings}
          className="inline-flex items-center gap-1 rounded-full border border-mauve/30 px-3 py-1 text-xs font-semibold text-ink transition hover:bg-mauve/5"
          aria-label={t("refresh")}
        >
          <RefreshCcw className="h-3 w-3" aria-hidden />
          {t("refresh")}
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

      {bookings === null ? (
        <p className="rounded-xl border border-mauve/20 bg-blush/20 p-3 text-sm text-ink/70">
          {t("loading")}
        </p>
      ) : grouped.length === 0 ? (
        <p className="rounded-xl border border-mauve/20 bg-blush/20 p-3 text-sm text-ink/60">
          {t("noFutureBookings")}
        </p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([day, items]) => (
            <div key={day}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-mauve">
                {new Date(`${day}T12:00:00Z`).toLocaleDateString("he-IL", {
                  timeZone: "Asia/Jerusalem",
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
              <ul className="grid gap-2">
                {items.map((booking) => {
                  const isPending = booking.status === "pending";
                  return (
                    <li
                      key={booking.id}
                      className={`flex flex-col gap-2 rounded-xl border p-3 text-sm sm:flex-row sm:items-center sm:justify-between ${
                        isPending
                          ? "border-amber-300 bg-amber-50"
                          : "border-emerald-300 bg-emerald-50"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              isPending
                                ? "bg-amber-200 text-amber-900"
                                : "bg-emerald-200 text-emerald-900"
                            }`}
                          >
                            {isPending ? (
                              <Clock className="h-3 w-3" aria-hidden />
                            ) : (
                              <CheckCircle2 className="h-3 w-3" aria-hidden />
                            )}
                            {isPending ? t("statusPending") : t("statusConfirmed")}
                          </span>
                          <p className="font-semibold text-ink">
                            {new Date(booking.startsAt).toLocaleTimeString("he-IL", {
                              timeZone: "Asia/Jerusalem",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" · "}
                            {services(booking.serviceId)}
                          </p>
                        </div>
                        <p className="text-ink/80">
                          {booking.fullName} · {booking.phoneNumber}
                        </p>
                        <p className="text-xs text-ink/50">
                          {t("idNumberShort")}: {booking.idNumber}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => onConfirm(booking)}
                            disabled={confirmingId === booking.id}
                            className="inline-flex items-center justify-center gap-1 rounded-full border border-emerald-500 bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                            aria-label={t("confirmAria", { name: booking.fullName })}
                          >
                            {confirmingId === booking.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                            ) : (
                              <CheckCircle2 className="h-3 w-3" aria-hidden />
                            )}
                            {t("confirm")}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => onRelease(booking)}
                          disabled={releasingId === booking.id}
                          className="inline-flex items-center justify-center gap-1 rounded-full border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                          aria-label={t("releaseAria", { name: booking.fullName })}
                        >
                          {releasingId === booking.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                          ) : (
                            <Trash2 className="h-3 w-3" aria-hidden />
                          )}
                          {t("release")}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
