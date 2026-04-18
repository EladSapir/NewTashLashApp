import { NextResponse } from "next/server";
import { createPendingBooking } from "@/lib/store";
import { sendBookingEmail } from "@/lib/email";
import { BookingRequest } from "@/lib/types";
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
    >;
    if (!isValidPhoneNumber(body.phoneNumber)) {
      throw new Error("Invalid phone number");
    }
    if (!isValidAge(body.age)) {
      throw new Error("Invalid age");
    }
    if (!isValidIdNumber(body.idNumber)) {
      throw new Error("Invalid ID number");
    }
    if (!isValidHealthSelection(body.healthItems)) {
      throw new Error("Invalid health declaration");
    }
    if (!body.policiesAccepted) {
      throw new Error("Clinic policy consent is required");
    }
    const booking = await createPendingBooking(body);
    await sendBookingEmail(booking);
    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Booking failed" },
      { status: 400 },
    );
  }
}
