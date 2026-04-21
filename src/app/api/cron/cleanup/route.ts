import { NextResponse } from "next/server";
import { cleanupPastAppointments } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Weekly cleanup endpoint invoked by Vercel Cron every Sunday around
 * 12:00 Israel time (see `vercel.json`). Deletes every past slot and
 * every past booking so the database doesn't grow forever.
 *
 * Security: Vercel Cron automatically attaches
 *     Authorization: Bearer $CRON_SECRET
 * when the `CRON_SECRET` env var is configured. We reject any request
 * that doesn't present that header (including manual GETs).
 */
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // Never allow an unauthenticated cron call in production.
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 },
    );
  }

  const result = await cleanupPastAppointments();
  return NextResponse.json({ ok: true, ...result });
}
