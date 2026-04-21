"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BookingRequest } from "@/lib/types";

export function PendingRequests() {
  const t = useTranslations("services");
  const [bookings, setBookings] = useState<BookingRequest[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/admin/bookings");
      const data = await response.json();
      setBookings(data.bookings ?? []);
    };
    void load();
  }, []);

  return (
    <section className="rounded-card bg-white p-4 shadow-soft">
      <h2 className="mb-3 text-lg font-semibold">Pending Requests</h2>
      <div className="space-y-2 text-sm">
        {bookings.map((booking) => (
          <div key={booking.id} className="rounded-xl border border-rose/30 px-3 py-2">
            <p className="font-medium">{booking.fullName}</p>
            <p>{booking.phoneNumber}</p>
            <p>{t(booking.serviceId)}</p>
            <p>
              {new Date(booking.startsAt).toLocaleString("he-IL", {
                timeZone: "Asia/Jerusalem",
              })}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
