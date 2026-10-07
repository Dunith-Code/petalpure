import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validators";
import { createOrder, CheckoutError } from "@/lib/checkout";
import { getSession } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  if (!rateLimit(`checkout:${clientIp(req)}`, 10, 15 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const session = await getSession();

  try {
    const order = await createOrder(parsed.data, session?.userId ?? null);
    return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber }, { status: 201 });
  } catch (e) {
    if (e instanceof CheckoutError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}