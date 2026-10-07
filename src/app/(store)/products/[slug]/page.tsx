import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import ProductDetail from "@/components/store/ProductDetail";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: { category: true, variants: { orderBy: { price: "asc" } } },
  });
}

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  return p ? { title: `${p.name} | PetalPure`, description: p.description.slice(0, 150) } : { title: "Not found | PetalPure" };
}

export default async function ProductPage({ params }: Ctx) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  return (
    <div>
      <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/products" className="hover:text-rose-600">Shop</Link>
        {" / "}
        <Link href={`/products?category=${p.category.slug}`} className="hover:text-rose-600">{p.category.name}</Link>
      </nav>
      <ProductDetail
        slug={p.slug}
        name={p.name}
        brand={p.brand}
        category={p.category.name}
        description={p.description}
        images={p.images}
        variants={p.variants.map((v) => ({ id: v.id, label: v.label, price: Number(v.price), stock: v.stock }))}
      />
    </div>
  );
}