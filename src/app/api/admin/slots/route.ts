import { NextResponse } from "next/server";
import { deleteAvailableSlot, listAvailableSlots, openRange } from "@/lib/store";
import { requireAdminSession } from "@/lib/auth";
import { isValidLocation } from "@/lib/constants";

export async function GET() {
  const authorized = await requireAdminSession();
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Admin sees slots from BOTH studios so the dashboard can label them.
  const slots = await listAvailableSlots();
  return NextResponse.json({ slots });
}

export async function POST(request: Request) {
  const authorized = await requireAdminSession();
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as {
      startAt?: string;
      endAt?: string;
      location?: string;
    };
    if (!body.startAt || !body.endAt) {
      return NextResponse.json({ error: "startAt and endAt are required" }, { status: 400 });
    }
    if (!isValidLocation(body.location)) {
      return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    }
    const created = await openRange(body.startAt, body.endAt, body.location);
    return NextResponse.json({ created });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create slot" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const authorized = await requireAdminSession();
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as { slotId?: string };
    if (!body.slotId) {
      return NextResponse.json({ error: "slotId is required" }, { status: 400 });
    }
    await deleteAvailableSlot(body.slotId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete slot" },
      { status: 400 },
    );
  }
}
