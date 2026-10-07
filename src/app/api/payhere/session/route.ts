import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { payhereConfig, checkoutHash, formatAmount } from "@/lib/payhere";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  if (!rateLimit(`payhere:${clientIp(req)}`, 20, 15 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  if (!orderId) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  let cfg;
  try {
    cfg = payhereConfig();
  } catch {
    return NextResponse.json({ error: "Online payment isn't available right now." }, { status: 500 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentMethod !== "PAYHERE") {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status !== "PENDING" || order.paymentStatus === "PAID") {
    return NextResponse.json({ error: "This order can't be paid online." }, { status: 409 });
  }

  const amount = formatAmount(Number(order.total)); // always from the DB, never from the client
  const currency = "LKR";
  const [first, ...rest] = order.customerName.split(" ");

  const fields = {
    merchant_id: cfg.merchantId,
    return_url: `${cfg.appUrl}/order/${order.id}`,
    cancel_url: `${cfg.appUrl}/order/${order.id}?cancelled=1`,
    notify_url: `${cfg.appUrl}/api/payhere/notify`,
    order_id: order.orderNumber,
    items: `PetalPure order ${order.orderNumber}`,
    currency,
    amount,
    first_name: first,
    last_name: rest.join(" ") || "-",
    email: order.email ?? "",
    phone: order.phone,
    address: order.address,
    city: order.city,
    country: "Sri Lanka",
    hash: checkoutHash(cfg.merchantId, order.orderNumber, amount, currency, cfg.secret),
  };

  return NextResponse.json({ action: cfg.action, fields });
}