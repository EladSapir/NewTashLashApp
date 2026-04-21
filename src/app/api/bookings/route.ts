import { NextResponse } from "next/server";
import { createPendingBooking } from "@/lib/store";
import { sendBookingEmail } from "@/lib/email";
import { SERVICE_HEALTH_FORMS } from "@/lib/constants";
import { BookingRequest, BookingSubmissionMeta } from "@/lib/types";
import {
  isValidAge,
  isValidHealthSelection,
  isValidIdNumber,
  isValidPhoneNumber,
} from "@/lib/validation";

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
    const bookingPayload: Omit<BookingRequest, "id" | "createdAt" | "status"> = {
      slotId: body.slotId,
      fullName: body.fullName,
      phoneNumber: body.phoneNumber,
      age: body.age,
      idNumber: body.idNumber,
      policiesAccepted: body.policiesAccepted,
      serviceId: body.serviceId,
      startsAt: body.startsAt,
      healthItems: body.healthItems,
    };

    const booking = await createPendingBooking(bookingPayload);
    await sendBookingEmail(booking, {
      healthDetails: body.healthDetails,
      signatureDataUrl: body.signatureDataUrl,
    });
    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Booking failed" },
      { status: 400 },
    );
  }
}
