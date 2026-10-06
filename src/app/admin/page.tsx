import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const LOW_STOCK = 5;

export default async function AdminDashboard() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [ordersToday, pendingOrders, activeProducts, lowStock, revenue] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.productVariant.count({ where: { stock: { lte: LOW_STOCK } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } }),
  ]);

  const paidRevenue = Number(revenue._sum.total ?? 0);

  const cards = [
    { label: "Orders today", value: ordersToday },
    { label: "Pending orders", value: pendingOrders },
    { label: "Paid revenue", value: `Rs. ${paidRevenue.toLocaleString("en-LK")}` },
    { label: "Active products", value: activeProducts },
    { label: `Low stock (≤ ${LOW_STOCK})`, value: lowStock, warn: lowStock > 0 },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">A quick look at your store today.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-card border p-5 ${
              c.warn ? "border-rose-500/40 bg-blush-50" : "border-blush-100 bg-white"
            }`}
          >
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-2 text-3xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}