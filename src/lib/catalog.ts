import type { Prisma } from "@prisma/client";
import type { CardProduct } from "@/components/store/ProductCard";

export type ProductWithRels = Prisma.ProductGetPayload<{ include: { variants: true; category: true } }>;

export function toCard(p: ProductWithRels): CardProduct {
  const prices = p.variants.map((v) => Number(v.price));
  return {
    slug: p.slug,
    name: p.name,
    category: p.category.name,
    image: p.images[0] ?? null,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    soldOut: p.variants.every((v) => v.stock === 0),
  };
}