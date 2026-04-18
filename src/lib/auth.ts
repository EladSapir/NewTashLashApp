import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "tash_admin_session";
const SECRET = process.env.ADMIN_SESSION_SECRET ?? "dev-secret";

function createToken(value: string) {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

export function isAdminPasswordValid(password: string) {
  const adminPassword = process.env.ADMIN_PASSWORD ?? "123456";
  return password === adminPassword;
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  const token = createToken("admin");
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  const expected = createToken("admin");
  const left = Buffer.from(token);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
