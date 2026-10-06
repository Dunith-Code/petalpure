import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";

export const COOKIE_NAME = "pp_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type Session = { userId: string; role: "CUSTOMER" | "ADMIN"; name: string };

function key() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error("JWT_SECRET missing or too short");
  return new TextEncoder().encode(s);
}

export async function createSession(user: { id: string; role: Session["role"]; name: string }) {
  const token = await new SignJWT({ role: user.role, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return { userId: payload.sub!, role: payload.role as Session["role"], name: payload.name as string };
  } catch {
    return null;
  }
}

/** Use inside every admin API handler and admin server page. Re-checks the DB, so a demoted admin loses access immediately. */
export async function requireAdmin(): Promise<Session | null> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  return user?.role === "ADMIN" ? session : null;
}