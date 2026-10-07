import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductCard from "@/components/store/ProductCard";
import { toCard } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, latest] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { variants: true, category: true },
    }),
  ]);

  return (
    <div className="space-y-14">
      <section className="rounded-card bg-gradient-to-br from-blush-100 via-blush-50 to-sage-100 px-6 py-14 text-center sm:py-20">
        <p className="text-sm uppercase tracking-widest text-rose-600">Gentle beauty</p>
        <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-semibold leading-tight sm:text-6xl">
          Skincare that feels as soft as it looks
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Creams, shampoos, lotions and more, made with kind ingredients for everyday care.
        </p>
        <Link
          href="/products"
          className="mt-8 inline-block rounded-full bg-rose-500 px-8 py-3 font-medium text-white transition hover:bg-rose-600"
        >
          Shop now
        </Link>
      </section>

      {categories.length > 0 && (
        <section aria-labelledby="cats">
          <h2 id="cats" className="text-3xl font-semibold">Shop by category</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                className="rounded-card border border-blush-100 bg-white px-4 py-6 text-center font-medium transition hover:border-rose-500/40 hover:bg-blush-50 hover:text-rose-600"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {latest.length > 0 && (
        <section aria-labelledby="new">
          <div className="flex items-end justify-between">
            <h2 id="new" className="text-3xl font-semibold">New arrivals</h2>
            <Link href="/products" className="text-sm font-medium text-rose-600 hover:underline">View all →</Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {latest.map((p) => (
              <ProductCard key={p.id} p={toCard(p)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}