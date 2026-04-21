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
  status: "pending";
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

export async function listAvailableSlots() {
  const slots = await prisma.slot.findMany({
    where: { status: "available" },
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
