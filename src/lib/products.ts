import { prisma } from "./db";
import { slugify } from "./slug";

export async function uniqueProductSlug(name: string, excludeId?: string) {
  const base = slugify(name) || "product";
  let slug = base;
  let n = 1;
  while (true) {
    const clash = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!clash || clash.id === excludeId) return slug;
    n++;
    slug = `${base}-${n}`;
  }
}