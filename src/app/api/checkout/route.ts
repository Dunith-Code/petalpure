import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validators";
import { createOrder, CheckoutError } from "@/lib/checkout";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  if (!rateLimit(`checkout:${clientIp(req)}`, 10, 15 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    // Only link the order to a user that really exists (a stale cookie must not break checkout)
    const session = await getSession();
    const user = session
      ? await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true } })
      : null;

    const order = await createOrder(parsed.data, user?.id ?? null);
    return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber }, { status: 201 });
  } catch (e) {
    if (e instanceof CheckoutError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[checkout] unexpected error", e); // visible in Vercel logs only
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}