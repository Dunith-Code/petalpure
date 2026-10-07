import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { payhereConfig, notifySignature, safeEqual, formatAmount } from "@/lib/payhere";

export async function POST(req: Request) {
  let cfg;
  try {
    cfg = payhereConfig();
  } catch {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const payload: Record<string, string> = {};
  for (const [k, v] of form.entries()) payload[k] = String(v);

  const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = payload;

  // 1) Authenticity: the signature can only be produced by someone who knows our secret
  if (merchant_id !== cfg.merchantId || !md5sig) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const expected = notifySignature(
    merchant_id,
    order_id ?? "",
    payhere_amount ?? "",
    payhere_currency ?? "",
    status_code ?? "",
    cfg.secret,
  );
  if (!safeEqual(md5sig, expected)) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  // 2) Consistency: the order exists and the amount and currency match what WE stored
  const order = await prisma.order.findUnique({ where: { orderNumber: order_id } });
  if (!order || order.paymentMethod !== "PAYHERE") return NextResponse.json({ error: "Unknown order" }, { status: 404 });
  if (payhere_currency !== "LKR" || formatAmount(Number(payhere_amount)) !== formatAmount(Number(order.total))) {
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  const code = Number.parseInt(status_code, 10);

  await prisma.$transaction(async (tx) => {
    await tx.paymentLog.create({ data: { orderId: order.id, statusCode: code, rawPayload: payload } });

    if (code === 2) {
      // Idempotent: a repeated callback changes nothing
      await tx.order.updateMany({
        where: { id: order.id, paymentStatus: { not: "PAID" } },
        data: { paymentStatus: "PAID" },
      });
    } else if (code === -1 || code === -2) {
      // Cancelled/failed attempt: customer may retry, stock stays reserved until the order expires
      await tx.order.updateMany({
        where: { id: order.id, paymentStatus: "PENDING" },
        data: { paymentStatus: "FAILED" },
      });
    }
    // 0 = pending, -3 = chargeback: logged only; the admin reviews these
  });

  return NextResponse.json({ ok: true });
}