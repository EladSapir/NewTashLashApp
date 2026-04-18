import { NextResponse } from "next/server";
import { listPendingBookings } from "@/lib/store";
import { requireAdminSession } from "@/lib/auth";

export async function GET() {
  const authorized = await requireAdminSession();
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookings = await listPendingBookings();
  return NextResponse.json({ bookings });
}
