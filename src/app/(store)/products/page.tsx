import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import ProductCard from "@/components/store/ProductCard";
import { toCard } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;
const SORTS = {
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
} as const;
type SortKey = keyof typeof SORTS;

type SP = { q?: string; category?: string; sort?: string; page?: string };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const sort: SortKey = sp.sort && sp.sort in SORTS ? (sp.sort as SortKey) : "newest";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const activeCat = categories.find((c) => c.slug === sp.category);

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(activeCat ? { categoryId: activeCat.id } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  // The catalogue is small, so we sort by price in memory (Prisma can't order by a relation's MIN)
  const all = (
    await prisma.product.findMany({ where, orderBy: { createdAt: "desc" }, include: { variants: true, category: true } })
  ).map(toCard);

  if (sort === "price-asc") all.sort((a, b) => a.minPrice - b.minPrice);
  if (sort === "price-desc") all.sort((a, b) => b.minPrice - a.minPrice);

  const total = all.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const items = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function href(over: Partial<SP>) {
    const params = new URLSearchParams();
    const next = { q, category: activeCat?.slug, sort: sort === "newest" ? undefined : sort, page: undefined, ...over };
    for (const [k, v] of Object.entries(next)) if (v) params.set(k, String(v));
    const s = params.toString();
    return s ? `/products?${s}` : "/products";
  }

  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition ${
      active ? "border-rose-500 bg-rose-500 text-white" : "border-blush-200 bg-white hover:border-rose-500/50 hover:text-rose-600"
    }`;

  return (
    <div>
      <h1 className="text-4xl font-semibold">{activeCat ? activeCat.name : q ? `Results for “${q}”` : "All products"}</h1>
      <p className="mt-1 text-sm text-muted">{total} product(s)</p>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        <Link href={href({ category: undefined })} className={chip(!activeCat)}>All</Link>
        {categories.map((c) => (
          <Link key={c.id} href={href({ category: c.slug })} className={chip(activeCat?.id === c.id)}>
            {c.name}
          </Link>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Sort:</span>
        {(Object.keys(SORTS) as SortKey[]).map((k) => (
          <Link key={k} href={href({ sort: k === "newest" ? undefined : k })} className={chip(sort === k)}>
            {SORTS[k]}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-card border border-blush-100 bg-white px-6 py-12 text-center">
          <p className="font-serif text-2xl">Nothing found</p>
          <p className="mt-1 text-sm text-muted">Try a different search or category.</p>
          <Link href="/products" className="mt-4 inline-block text-sm font-medium text-rose-600 hover:underline">
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.slug} p={p} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-8 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={href({ page: String(page - 1) })} className="text-rose-600 hover:underline">← Previous</Link> : <span />}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages ? <Link href={href({ page: String(page + 1) })} className="text-rose-600 hover:underline">Next →</Link> : <span />}
        </div>
      )}
    </div>
  );
}