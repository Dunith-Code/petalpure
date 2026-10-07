import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const HOLD_MS = 60 * 60 * 1000; // hold reserved stock for 1 hour

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stale = await prisma.order.findMany({
    where: {
      paymentMethod: "PAYHERE",
      status: "PENDING",
      paymentStatus: { in: ["PENDING", "FAILED"] },
      createdAt: { lt: new Date(Date.now() - HOLD_MS) },
    },
    include: { items: true },
    take: 50,
  });

  let expired = 0;
  for (const o of stale) {
    await prisma.$transaction(async (tx) => {
      const res = await tx.order.updateMany({
        where: { id: o.id, status: "PENDING", paymentStatus: { in: ["PENDING", "FAILED"] } },
        data: { status: "CANCELLED", paymentStatus: "FAILED" },
      });
      if (res.count === 1) {
        for (const i of o.items) {
          await tx.productVariant.update({ where: { id: i.variantId }, data: { stock: { increment: i.quantity } } });
        }
        expired++;
      }
    });
  }
  return NextResponse.json({ expired });
}