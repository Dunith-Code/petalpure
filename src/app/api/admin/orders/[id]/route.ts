import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { orderUpdateSchema } from "@/lib/validators";
import { NEXT_STATUSES, type OrderStatusT, type PaymentStatusT } from "@/lib/orders";

type Ctx = { params: Promise<{ id: string }> };

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const parsed = orderUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { status, paymentStatus } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!order) throw new ApiError("Order not found", 404);

      const data: { status?: OrderStatusT; paymentStatus?: PaymentStatusT } = {};

      if (status && status !== order.status) {
        if (!NEXT_STATUSES[order.status].includes(status)) {
          throw new ApiError(`An order can't move from ${order.status} to ${status}`, 409);
        }
        data.status = status;
      }

      if (paymentStatus && paymentStatus !== order.paymentStatus) {
        if (order.status === "CANCELLED") {
          throw new ApiError("Cancelled orders can't change payment status", 409);
        }
        data.paymentStatus = paymentStatus;
      }

      if (Object.keys(data).length === 0) return;

      // Only applies if nobody changed the status since this admin loaded the page
      const result = await tx.order.updateMany({ where: { id, status: order.status }, data });
      if (result.count === 0) throw new ApiError("This order was just changed. Refresh and try again.", 409);

      if (data.status === "CANCELLED") {
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}