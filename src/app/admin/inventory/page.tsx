import { prisma } from "@/lib/db";
import InventoryTable from "@/components/admin/InventoryTable";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const variants = await prisma.productVariant.findMany({
    orderBy: [{ stock: "asc" }, { sku: "asc" }],
    include: { product: { select: { name: true, isActive: true } } },
  });

  return (
    <div>
      <h1 className="text-3xl font-semibold">Inventory</h1>
      <p className="mt-1 text-sm text-muted">
        Update stock per variant. Items with the lowest stock appear first.
      </p>
      <InventoryTable
        rows={variants.map((v) => ({
          id: v.id,
          product: v.product.name,
          active: v.product.isActive,
          label: v.label,
          sku: v.sku,
          stock: v.stock,
        }))}
      />
    </div>
  );
}