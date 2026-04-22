import { NextResponse } from "next/server";
import {
  createPendingBooking,
  listFutureBookingsForIdNumber,
} from "@/lib/store";
import { sendBookingEmail } from "@/lib/email";
import { SERVICE_HEALTH_FORMS } from "@/lib/constants";
import { BookingRequest, BookingSubmissionMeta } from "@/lib/types";
import {
  isValidAge,
  isValidHealthSelection,
  isValidIdNumber,
  isValidPhoneNumber,
} from "@/lib/validation";

const MAX_FUTURE_BOOKINGS_PER_CLIENT = 2;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Omit<
      BookingRequest,
      "id" | "createdAt" | "status"
    > &
      BookingSubmissionMeta;
    if (!isValidPhoneNumber(body.phoneNumber)) {
      throw new Error("Invalid phone number");
    }
    if (!isValidAge(body.age)) {
      throw new Error("Invalid age");
    }
    if (!isValidIdNumber(body.idNumber)) {
      throw new Error("Invalid ID number");
    }
    const healthForm = SERVICE_HEALTH_FORMS[body.serviceId as keyof typeof SERVICE_HEALTH_FORMS];
    if (!healthForm) {
      throw new Error("Invalid service");
    }
    if (!isValidHealthSelection(body.healthItems, healthForm)) {
      throw new Error("Invalid health declaration");
    }
    if (
      !body.signatureDataUrl ||
      !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(body.signatureDataUrl)
    ) {
      throw new Error("Signature is required");
    }

    if (!body.policiesAccepted) {
      throw new Error("Clinic policy consent is required");
    }

    // Enforce per-client booking quota (based on ID number) BEFORE
    // locking any slot / creating a row. Only bookings that haven't
    // already started/passed are counted.
    const normalizedIdNumber = body.idNumber.replace(/\D/g, "");
    const existingFutureBookings = await listFutureBookingsForIdNumber(
      normalizedIdNumber,
    );
    // Only return a sanitized subset of the existing bookings — we
    // don't want to leak PII (name, phone, health items, signature)
    // to anyone who might probe with an ID number.
    const sanitizedExistingBookings = existingFutureBookings.map((existing) => ({
      id: existing.id,
      serviceId: existing.serviceId,
      startsAt: existing.startsAt,
    }));
    const sameServiceBooking = existingFutureBookings.find(
      (existing) => existing.serviceId === body.serviceId,
    );
    if (sameServiceBooking) {
      return NextResponse.json(
        {
          error: "duplicate_service_booking",
          reason: "duplicate_service_booking",
          existingBookings: sanitizedExistingBookings,
        },
        { status: 409 },
      );
    }
    if (existingFutureBookings.length >= MAX_FUTURE_BOOKINGS_PER_CLIENT) {
      return NextResponse.json(
        {
          error: "max_future_bookings_reached",
          reason: "max_future_bookings_reached",
          existingBookings: sanitizedExistingBookings,
        },
        { status: 409 },
      );
    }

    const bookingPayload: Omit<BookingRequest, "id" | "createdAt" | "status"> = {
      slotId: body.slotId,
      fullName: body.fullName,
      phoneNumber: body.phoneNumber,
      age: body.age,
      idNumber: normalizedIdNumber,
      policiesAccepted: body.policiesAccepted,
      serviceId: body.serviceId,
      startsAt: body.startsAt,
      healthItems: body.healthItems,
    };

    const booking = await createPendingBooking(bookingPayload);
    await sendBookingEmail(booking, {
      healthDetails: body.healthDetails,
      signatureDataUrl: body.signatureDataUrl,
      submittedPhoneNumber: body.phoneNumber,
    });
    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Booking failed" },
      { status: 400 },
    );
  }
}
