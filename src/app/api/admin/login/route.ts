import { NextResponse } from "next/server";
import { isAdminPasswordValid, setAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  if (!isAdminPasswordValid(body.password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}
