import { prisma } from "@/lib/db";
import CategoryManager from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <h1 className="text-3xl font-semibold">Categories</h1>
      <p className="mt-1 text-sm text-muted">Organise your products into groups shoppers can filter by.</p>
      <CategoryManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          productCount: c._count.products,
        }))}
      />
    </div>
  );
}