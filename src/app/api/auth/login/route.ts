import { NextResponse } from "next/server";
import argon2 from "argon2";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validators";
import { createSession } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  if (!rateLimit(`login:${clientIp(req)}`, 10, 15 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  // Same work and same message whether or not the email exists
  const ok = user ? await argon2.verify(user.passwordHash, password) : (await argon2.hash(password), false);
  if (!user || !ok) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  await createSession(user);
  return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } });
}