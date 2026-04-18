import { NextResponse } from "next/server";
import { deleteAvailableSlot, listAvailableSlots, openRange } from "@/lib/store";
import { requireAdminSession } from "@/lib/auth";

export async function GET() {
  const authorized = await requireAdminSession();
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slots = await listAvailableSlots();
  return NextResponse.json({ slots });
}

export async function POST(request: Request) {
  const authorized = await requireAdminSession();
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const created = await openRange(body.startAt, body.endAt);
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
