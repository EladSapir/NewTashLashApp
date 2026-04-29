"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Plus, Trash2 } from "lucide-react";
import { Location, Slot } from "@/lib/types";
import { LOCATION_CITY_HE, LOCATION_IDS } from "@/lib/constants";

/**
 * Admin slot management.
 *
 * Renders three vertically-stacked sections in this order:
 *   1. Range-opening form (single card, with a city selector)
 *   2. {children} — the dashboard injects <BookingsManager /> here so
 *      the layout is: form → bookings → active slots.
 *   3. Active slots list (per-day, per-studio with a Tel-Aviv badge)
 *
 * State (slots + error + submitting) is owned here so the form's
 * "create" action can immediately refresh the active-slots list.
 */
export function SlotManager({ children }: { children?: ReactNode }) {
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [location, setLocation] = useState<Location>("ashdod");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadSlots = async () => {
    const response = await fetch("/api/admin/slots");
    const data = await response.json();
    setSlots(data.slots ?? []);
  };

  useEffect(() => {
    void loadSlots();
  }, []);

  const grouped = useMemo(() => {
    const dayFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jerusalem",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const map = new Map<string, Slot[]>();
    for (const slot of slots) {
      const day = dayFormatter.format(new Date(slot.startsAt));
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(slot);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [slots]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startAt, endAt, location }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? "פעולה נכשלה");
        return;
      }
      setError("");
      setStartAt("");
      setEndAt("");
      void loadSlots();
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (slotId: string) => {
    const response = await fetch("/api/admin/slots", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId }),
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "מחיקת סלוט נכשלה");
      return;
    }
    setError("");
    void loadSlots();
  };

  const cityLabel = LOCATION_CITY_HE[location];

  return (
    <>
      <div className="rounded-card border border-mauve/15 bg-white/90 p-5 shadow-soft backdrop-blur">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-burgundy">
          <Plus className="h-4 w-4" />
          פתיחת טווח שעות זמין
        </h2>
        <form onSubmit={onSubmit} className="grid gap-3">
          <div>
            <span className="mb-2 block text-xs font-medium text-ink/60">
              לאיזה סטודיו לפתוח את התורים?
            </span>
            <div
              role="radiogroup"
              aria-label="בחירת סטודיו"
              className="grid grid-cols-2 gap-2"
            >
              {LOCATION_IDS.map((id) => {
                const active = location === id;
                const isTelAviv = id === "tel_aviv";
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setLocation(id)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? isTelAviv
                          ? "border-mauve bg-gradient-to-l from-mauve to-burgundy text-white shadow-soft"
                          : "border-burgundy bg-burgundy text-white shadow-soft"
                        : "border-mauve/25 bg-white text-ink hover:border-mauve"
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {LOCATION_CITY_HE[id]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-ink/60">התחלה</span>
              <input
                type="datetime-local"
                className="w-full rounded-xl border border-mauve/25 bg-white px-3 py-3 focus:border-mauve focus:outline-none"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-ink/60">סיום</span>
              <input
                type="datetime-local"
                className="w-full rounded-xl border border-mauve/25 bg-white px-3 py-3 focus:border-mauve focus:outline-none"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                required
              />
            </label>
          </div>
          <button
            className={`inline-flex items-center justify-center gap-2 rounded-full py-3 font-semibold text-white shadow-soft transition disabled:opacity-60 ${
              location === "tel_aviv"
                ? "bg-gradient-to-l from-mauve to-burgundy hover:from-burgundy hover:to-mauve"
                : "bg-burgundy hover:bg-mauve"
            }`}
            type="submit"
            disabled={submitting}
          >
            <Plus className="h-4 w-4" />
            פתיחת טווח ב{cityLabel}
          </button>
        </form>
        {error ? (
          <p className="mt-3 rounded-xl border-2 border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700">
            {error}
          </p>
        ) : null}
      </div>

      {children}

      <div className="rounded-card border border-mauve/15 bg-white/90 p-5 shadow-soft backdrop-blur">
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-burgundy">
          <Calendar className="h-4 w-4" />
          סלוטים פעילים
        </h3>
        {grouped.length === 0 ? (
          <p className="rounded-xl border border-mauve/20 bg-blush/20 p-3 text-sm text-ink/60">
            אין סלוטים פעילים כרגע.
          </p>
        ) : (
          <div className="space-y-3">
            {grouped.map(([day, items]) => (
              <div key={day}>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-mauve">
                  {new Date(`${day}T12:00:00Z`).toLocaleDateString("he-IL", {
                    timeZone: "Asia/Jerusalem",
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {items.map((slot) => {
                    const isTelAviv = slot.location === "tel_aviv";
                    return (
                      <div
                        key={slot.id}
                        className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${
                          isTelAviv
                            ? "border-mauve bg-gradient-to-l from-mauve/15 to-rose/10"
                            : "border-mauve/20 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>
                            {new Date(slot.startsAt).toLocaleTimeString("he-IL", {
                              timeZone: "Asia/Jerusalem",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <LocationBadge location={slot.location} />
                        </div>
                        <button
                          type="button"
                          onClick={() => onDelete(slot.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-red-300 px-3 py-1 text-xs font-bold text-red-700 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          מחיקה
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function LocationBadge({ location }: { location: Location }) {
  const cityLabel = LOCATION_CITY_HE[location];
  const isTelAviv = location === "tel_aviv";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
        isTelAviv
          ? "bg-mauve text-white shadow-sm"
          : "bg-blush/70 text-burgundy"
      }`}
    >
      <MapPin className="h-3 w-3" aria-hidden />
      {cityLabel}
    </span>
  );
}
