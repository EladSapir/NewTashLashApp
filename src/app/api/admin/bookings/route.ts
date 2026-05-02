import { NextResponse } from "next/server";
import {
  cancelBookingAndReleaseSlots,
  confirmBooking,
  listBookingsBetween,
  listFutureBookings,
} from "@/lib/store";
import { requireAdminSession } from "@/lib/auth";

export async function GET(request: Request) {
  const authorized = await requireAdminSession();
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  // When `from` and `to` are provided we return every booking in that
  // range (used by the weekly calendar so the admin can browse any week,
  // including past weeks). Without them we keep the original behaviour
  // and return only future bookings for the upcoming-bookings list.
  if (fromParam && toParam) {
    const from = new Date(fromParam);
    const to = new Date(toParam);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return NextResponse.json(
        { error: "Invalid `from`/`to` parameters" },
        { status: 400 },
      );
    }
    const bookings = await listBookingsBetween(from, to);
    return NextResponse.json({ bookings });
  }

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
