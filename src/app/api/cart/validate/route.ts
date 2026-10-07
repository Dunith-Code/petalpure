import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cartValidateSchema } from "@/lib/validators";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  if (!rateLimit(`cart:${clientIp(req)}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const parsed = cartValidateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart" }, { status: 400 });

  const ids = [...new Set(parsed.data.items.map((i) => i.variantId))];
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: ids } },
    include: { product: { select: { name: true, slug: true, images: true, isActive: true } } },
  });

  return NextResponse.json({
    variants: variants.map((v) => ({
      variantId: v.id,
      slug: v.product.slug,
      name: v.product.name,
      image: v.product.images[0] ?? null,
      variantLabel: v.label,
      price: Number(v.price),
      stock: v.stock,
      available: v.product.isActive,
    })),
  });
}