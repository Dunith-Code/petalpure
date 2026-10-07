import { randomInt } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { SHIPPING_FEE } from "./constants";
import type { CheckoutInput } from "./validators";

export class CheckoutError extends Error {
  constructor(message: string, public status = 409) {
    super(message);
  }
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion
function newOrderNumber() {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `PP-${s}`;
}

const money = (n: number) => Math.round(n * 100) / 100;

export async function createOrder(input: CheckoutInput, userId: string | null) {
  // Merge duplicate lines for the same variant
  const qtyById = new Map<string, number>();
  for (const i of input.items) qtyById.set(i.variantId, (qtyById.get(i.variantId) ?? 0) + i.qty);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const variants = await tx.productVariant.findMany({
            where: { id: { in: [...qtyById.keys()] } },
            include: { product: { select: { name: true, isActive: true } } },
          });
          if (variants.length !== qtyById.size) {
            throw new CheckoutError("Some items in your cart are no longer available. Please review your cart.");
          }

          let subtotal = 0;
          const items: Prisma.OrderItemCreateWithoutOrderInput[] = [];

          for (const v of variants) {
            const qty = qtyById.get(v.id)!;
            if (!v.product.isActive) {
              throw new CheckoutError(`${v.product.name} is no longer available. Please review your cart.`);
            }

            // Atomic guarded decrement: succeeds only if enough stock remains right now
            const reserved = await tx.productVariant.updateMany({
              where: { id: v.id, stock: { gte: qty } },
              data: { stock: { decrement: qty } },
            });
            if (reserved.count === 0) {
              throw new CheckoutError(
                `Sorry, ${v.product.name} (${v.label}) doesn't have enough stock for your quantity. Please review your cart.`,
              );
            }

            subtotal += Number(v.price) * qty;
            items.push({
              variant: { connect: { id: v.id } },
              productName: v.product.name, // snapshots: later edits never change past orders
              variantLabel: v.label,
              unitPrice: v.price,
              quantity: qty,
            });
          }

          subtotal = money(subtotal);
          const shipping = SHIPPING_FEE;

          return tx.order.create({
            data: {
              orderNumber: newOrderNumber(),
              userId,
              customerName: input.customerName,
              email: input.email || null,
              phone: input.phone,
              address: input.address,
              city: input.city,
              paymentMethod: input.paymentMethod,
              subtotal,
              shipping,
              total: money(subtotal + shipping),
              items: { create: items },
            },
            select: { id: true, orderNumber: true },
          });
        },
        { timeout: 20_000, maxWait: 10_000 },
      );
    } catch (e) {
      // Extremely unlikely order-number collision: retry with a new number
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && attempt < 2) continue;
      throw e;
    }
  }
  throw new CheckoutError("We couldn't place your order. Please try again.", 500);
}