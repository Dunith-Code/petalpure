import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validators";
import { uniqueProductSlug } from "@/lib/products";

type Ctx = { params: Promise<{ id: string }> };

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { variants, brand, ...data } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id }, select: { id: true, name: true } });
      if (!product) throw new ApiError("Product not found", 404);

      const category = await tx.category.findUnique({ where: { id: data.categoryId } });
      if (!category) throw new ApiError("Category not found", 400);

      const existing = await tx.productVariant.findMany({ where: { productId: id }, select: { id: true } });
      const existingIds = new Set(existing.map((v) => v.id));

      for (const v of variants) {
        if (v.id && !existingIds.has(v.id)) throw new ApiError("Invalid variant", 400);
      }

      const keep = new Set(variants.filter((v) => v.id).map((v) => v.id!));
      const removed = existing.filter((v) => !keep.has(v.id)).map((v) => v.id);
      if (removed.length) {
        const used = await tx.orderItem.count({ where: { variantId: { in: removed } } });
        if (used > 0) {
          throw new ApiError("A removed variant appears in past orders. Set its stock to 0 instead of deleting it.", 409);
        }
        await tx.productVariant.deleteMany({ where: { id: { in: removed } } });
      }

      await tx.product.update({
        where: { id },
        data: {
          ...data,
          brand: brand || null,
          slug: product.name === data.name ? undefined : await uniqueProductSlug(data.name, id),
        },
      });

      for (const { id: variantId, ...v } of variants) {
        if (variantId) await tx.productVariant.update({ where: { id: variantId }, data: v });
        else await tx.productVariant.create({ data: { ...v, productId: id } });
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "A variant SKU already exists. SKUs must be unique." }, { status: 409 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const ordered = await prisma.orderItem.count({ where: { variant: { productId: id } } });
  if (ordered > 0) {
    return NextResponse.json(
      { error: "This product appears in past orders and can't be deleted. Mark it inactive instead." },
      { status: 409 },
    );
  }

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}