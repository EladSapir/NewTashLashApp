import { NextResponse } from "next/server";
import {
  cancelBookingAndReleaseSlots,
  confirmBooking,
  listFutureBookings,
} from "@/lib/store";
import { requireAdminSession } from "@/lib/auth";

export async function GET() {
  const authorized = await requireAdminSession();
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookings = await listFutureBookings();
  return NextResponse.json({ bookings });
}

export async function PATCH(request: Request) {
  const authorized = await requireAdminSession();
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as {
      bookingId?: string;
      action?: "confirm";
    };
    if (!body.bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }
    if (body.action === "confirm") {
      await confirmBooking(body.bookingId);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update booking" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const authorized = await requireAdminSession();
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as { bookingId?: string };
    if (!body.bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }
    await cancelBookingAndReleaseSlots(body.bookingId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel booking" },
      { status: 400 },
    );
  }
}
