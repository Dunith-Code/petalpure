import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { variants: { orderBy: { price: "asc" } } } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <h1 className="text-3xl font-semibold">Edit product</h1>
      <ProductForm
        categories={categories}
        initial={{
          id: product.id,
          name: product.name,
          brand: product.brand ?? "",
          description: product.description,
          categoryId: product.categoryId,
          isActive: product.isActive,
          images: product.images,
          variants: product.variants.map((v) => ({
            id: v.id,
            label: v.label,
            sku: v.sku,
            price: String(v.price),
            stock: String(v.stock),
          })),
        }}
      />
    </div>
  );
}