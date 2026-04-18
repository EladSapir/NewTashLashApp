"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { Slot } from "@/lib/types";

export function SlotManager() {
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [error, setError] = useState("");

  const loadSlots = async () => {
    const response = await fetch("/api/admin/slots");
    const data = await response.json();
    setSlots(data.slots ?? []);
  };

  useEffect(() => {
    void loadSlots();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of slots) {
      const day = slot.startsAt.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(slot);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [slots]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/admin/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startAt, endAt }),
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

  return (
    <section className="space-y-4">
      <div className="rounded-card border border-mauve/15 bg-white/90 p-5 shadow-soft backdrop-blur">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-burgundy">
          <Plus className="h-4 w-4" />
          פתיחת טווח שעות זמין
        </h2>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
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
          <button
            className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-burgundy py-3 font-semibold text-white shadow-soft transition hover:bg-mauve"
            type="submit"
          >
            <Plus className="h-4 w-4" />
            פתיחת טווח
          </button>
        </form>
        {error ? (
          <p className="mt-3 rounded-xl border-2 border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700">
            {error}
          </p>
        ) : null}
      </div>

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
                  {new Date(`${day}T00:00:00`).toLocaleDateString("he-IL", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {items.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between rounded-xl border border-mauve/20 bg-white px-3 py-2 text-sm"
                    >
                      <span>
                        {new Date(slot.startsAt).toLocaleTimeString("he-IL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDelete(slot.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-300 px-3 py-1 text-xs font-bold text-red-700 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        מחיקה
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
