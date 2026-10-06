import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductRowActions from "@/components/admin/ProductRowActions";

export const dynamic = "force-dynamic";

const LOW_STOCK = 5;
const rs = (n: number) => `Rs. ${n.toLocaleString("en-LK")}`;

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, variants: true },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Products</h1>
          <p className="mt-1 text-sm text-muted">{products.length} product(s) in your catalogue.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-xl bg-rose-500 px-5 py-2 font-medium text-white transition hover:bg-rose-600"
        >
          New product
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-card border border-blush-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-blush-50 text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No products yet.
                </td>
              </tr>
            )}
            {products.map((p) => {
              const prices = p.variants.map((v) => Number(v.price));
              const min = Math.min(...prices);
              const max = Math.max(...prices);
              const stock = p.variants.reduce((s, v) => s + v.stock, 0);
              const low = p.variants.some((v) => v.stock <= LOW_STOCK);
              return (
                <tr key={p.id} className="border-t border-blush-100 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted">{p.variants.length} variant(s)</p>
                  </td>
                  <td className="px-4 py-3">{p.category.name}</td>
                  <td className="whitespace-nowrap px-4 py-3">{min === max ? rs(min) : `${rs(min)} – ${rs(max)}`}</td>
                  <td className="px-4 py-3">
                    {stock}
                    {low && <span className="ml-2 rounded-full bg-blush-100 px-2 py-0.5 text-xs text-rose-600">Low</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        p.isActive ? "bg-sage-100 text-ink" : "bg-blush-100 text-muted"
                      }`}
                    >
                      {p.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ProductRowActions id={p.id} name={p.name} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}