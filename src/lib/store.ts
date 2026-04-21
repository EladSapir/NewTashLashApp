import { BookingRequest, ServiceType, Slot } from "./types";
import { prisma } from "./prisma";
import { SERVICES, SLOT_INTERVAL_MINUTES } from "./constants";
import { parseIsraelLocalDateTime } from "./timezone";

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}

function isContinuous(slots: { startsAt: Date }[], expectedUnits: number) {
  if (slots.length !== expectedUnits) return false;
  for (let i = 1; i < slots.length; i += 1) {
    const diffMs = slots[i].startsAt.getTime() - slots[i - 1].startsAt.getTime();
    if (diffMs !== SLOT_INTERVAL_MINUTES * 60000) return false;
  }
  return true;
}

function mapSlot(slot: {
  id: string;
  startsAt: Date;
  status: "available" | "pending" | "confirmed";
}): Slot {
  return {
    id: slot.id,
    startsAt: slot.startsAt.toISOString(),
    status: slot.status,
  };
}

function mapBooking(booking: {
  id: string;
  slotId: string;
  fullName: string;
  phoneNumber: string;
  age: number;
  idNumber: string;
  policiesAccepted: boolean;
  serviceId: string;
  startsAt: Date;
  healthItems: string[];
  status: "pending" | "confirmed";
  createdAt: Date;
}): BookingRequest {
  return {
    id: booking.id,
    slotId: booking.slotId,
    fullName: booking.fullName,
    phoneNumber: booking.phoneNumber,
    age: booking.age,
    idNumber: booking.idNumber,
    policiesAccepted: booking.policiesAccepted,
    serviceId: booking.serviceId,
    startsAt: booking.startsAt.toISOString(),
    healthItems: booking.healthItems as BookingRequest["healthItems"],
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
  };
}

export async function openRange(startAt: string, endAt: string) {
  const startDate = parseIsraelLocalDateTime(startAt);
  const endDate = parseIsraelLocalDateTime(endAt);

  if (!(startDate < endDate)) {
    throw new Error("טווח השעות אינו תקין");
  }

  const timestamps: Date[] = [];
  for (
    let cursor = startDate;
    cursor < endDate;
    cursor = addMinutes(cursor, SLOT_INTERVAL_MINUTES)
  ) {
    timestamps.push(new Date(cursor));
  }

  const existing = await prisma.slot.findMany({
    where: {
      startsAt: { in: timestamps },
    },
    select: { startsAt: true },
  });
  const existingSet = new Set(existing.map((item) => item.startsAt.getTime()));

  const rows = timestamps
    .filter((timestamp) => !existingSet.has(timestamp.getTime()))
    .map((timestamp) => ({
      startsAt: timestamp,
      status: "available" as const,
    }));

  if (rows.length === 0) return 0;
  const result = await prisma.slot.createMany({ data: rows });
  return result.count;
}

/**
 * Returns the UTC timestamp for the start of "tomorrow" in Israel local
 * time. Clients may only book for dates strictly after today in Israel.
 */
function startOfTomorrowIsrael(now = new Date()): Date {
  const dayFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dayFormatter.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  const year = get("year");
  const month = get("month");
  const day = get("day");
  // The local-Israel wall-clock time "YYYY-MM-DDT00:00" of the NEXT day.
  const pad = (value: number) => `${value}`.padStart(2, "0");
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
  const y = nextDay.getUTCFullYear();
  const m = pad(nextDay.getUTCMonth() + 1);
  const d = pad(nextDay.getUTCDate());
  return parseIsraelLocalDateTime(`${y}-${m}-${d}T00:00`);
}

export async function listAvailableSlots() {
  const slots = await prisma.slot.findMany({
    where: {
      status: "available",
      startsAt: { gte: startOfTomorrowIsrael() },
    },
    orderBy: { startsAt: "asc" },
  });

  const deduped = new Map<number, Slot>();
  for (const slot of slots) {
    const key = slot.startsAt.getTime();
    if (!deduped.has(key)) deduped.set(key, mapSlot(slot));
  }

  return [...deduped.values()];
}

export async function listPendingBookings() {
  const bookings = await prisma.booking.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  return bookings.map(mapBooking);
}

/**
 * Returns every booking whose `startsAt` is still in the future (any status).
 * Used by the admin dashboard to power the "release an appointment" flow.
 */
export async function listFutureBookings() {
  const bookings = await prisma.booking.findMany({
    where: { startsAt: { gt: new Date() } },
    orderBy: { startsAt: "asc" },
  });
  return bookings.map(mapBooking);
}

/**
 * Returns every future booking tied to the given Israeli ID number.
 * Only considers bookings whose `startsAt` hasn't passed yet.
 */
export async function listFutureBookingsForIdNumber(idNumber: string) {
  const normalized = idNumber.replace(/\D/g, "");
  if (!normalized) return [];
  const bookings = await prisma.booking.findMany({
    where: {
      idNumber: normalized,
      startsAt: { gt: new Date() },
    },
    orderBy: { startsAt: "asc" },
  });
  return bookings.map(mapBooking);
}

/**
 * Marks a pending booking as confirmed and locks every slot it occupies
 * to `confirmed` too, so the admin has a clear "approved" state.
 */
export async function confirmBooking(bookingId: string) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new Error("התור לא נמצא");
    }
    if (booking.status === "confirmed") {
      return;
    }

    const service = (SERVICES as Record<string, { durationMinutes: number }>)[
      booking.serviceId
    ];
    const duration = service?.durationMinutes ?? SLOT_INTERVAL_MINUTES;
    const endAt = addMinutes(booking.startsAt, duration);

    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "confirmed" },
    });

    await tx.slot.updateMany({
      where: {
        startsAt: { gte: booking.startsAt, lt: endAt },
        status: "pending",
      },
      data: { status: "confirmed" },
    });
  });
}

/**
 * Cancels a booking made by a client and releases every slot that was
 * locked for that treatment back to `available`, so the time becomes
 * bookable again for someone else.
 */
export async function cancelBookingAndReleaseSlots(bookingId: string) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new Error("התור לא נמצא");
    }

    const service = (SERVICES as Record<string, { durationMinutes: number }>)[
      booking.serviceId
    ];
    const duration = service?.durationMinutes ?? SLOT_INTERVAL_MINUTES;
    const endAt = addMinutes(booking.startsAt, duration);

    await tx.booking.delete({ where: { id: booking.id } });

    await tx.slot.updateMany({
      where: {
        startsAt: { gte: booking.startsAt, lt: endAt },
        status: { in: ["pending", "confirmed"] },
      },
      data: { status: "available" },
    });
  });
}

export async function createPendingBooking(
  payload: Omit<BookingRequest, "id" | "createdAt" | "status">,
) {
  const service = (SERVICES as Record<string, { durationMinutes: number }>)[
    payload.serviceId
  ];
  if (!service) {
    throw new Error("טיפול לא חוקי");
  }

  const booking = await prisma.$transaction(async (tx) => {
    const selectedSlot = await tx.slot.findUnique({
      where: { id: payload.slotId },
    });

    if (!selectedSlot || selectedSlot.status !== "available") {
      throw new Error("השעה שנבחרה כבר לא זמינה");
    }

    if (selectedSlot.startsAt < startOfTomorrowIsrael()) {
      throw new Error("ניתן לקבוע תורים רק החל ממחר");
    }

    const duration = service.durationMinutes;
    const units = duration / SLOT_INTERVAL_MINUTES;
    const endAt = addMinutes(selectedSlot.startsAt, duration);

    const relevantSlots = await tx.slot.findMany({
      where: {
        startsAt: { gte: selectedSlot.startsAt, lt: endAt },
        status: "available",
      },
      orderBy: { startsAt: "asc" },
    });

    if (!isContinuous(relevantSlots, units)) {
      throw new Error("הטווח הנדרש לטיפול כבר לא זמין, בחרי שעה אחרת");
    }

    const lockResult = await tx.slot.updateMany({
      where: {
        id: { in: relevantSlots.map((slot) => slot.id) },
        status: "available",
      },
      data: { status: "pending" },
    });

    if (lockResult.count !== units) {
      throw new Error("הטווח הנדרש לטיפול כבר נתפס, בחרי שעה אחרת");
    }

    return tx.booking.create({
      data: {
        slotId: selectedSlot.id,
        fullName: payload.fullName,
        phoneNumber: payload.phoneNumber,
        age: payload.age,
        idNumber: payload.idNumber,
        policiesAccepted: payload.policiesAccepted,
        serviceId: payload.serviceId,
        startsAt: selectedSlot.startsAt,
        healthItems: payload.healthItems,
        status: "pending",
      },
    });
  });

  return mapBooking(booking);
}

export async function deleteAvailableSlot(slotId: string) {
  return prisma.$transaction(async (tx) => {
    const slot = await tx.slot.findUnique({ where: { id: slotId } });
    if (!slot || slot.status !== "available") {
      throw new Error("אפשר למחוק רק סלוט זמין");
    }

    await tx.slot.delete({ where: { id: slotId } });
  });
}

/**
 * Deletes bookings whose appointment time has already passed, plus
 * every slot whose start time has already passed (any status).
 * Bookings MUST be deleted first, because a Booking row has a
 * `onDelete: Restrict` foreign key to Slot — so a Slot can't be
 * deleted while a Booking still references it.
 *
 * Idempotent: safe to run on any schedule and/or manually.
 */
export async function cleanupPastAppointments(now = new Date()) {
  const deletedBookings = await prisma.booking.deleteMany({
    where: { startsAt: { lt: now } },
  });
  const deletedSlots = await prisma.slot.deleteMany({
    where: { startsAt: { lt: now } },
  });
  return {
    deletedBookings: deletedBookings.count,
    deletedSlots: deletedSlots.count,
  };
}

/** Export the unused-legacy openSlot in case it's imported elsewhere. */
export async function openSlot(_serviceId: ServiceType, startsAt: string) {
  const startsAtDate = new Date(startsAt);
  const slot = await prisma.slot.create({
    data: {
      startsAt: startsAtDate,
      status: "available",
    },
  });
  return mapSlot(slot);
}
