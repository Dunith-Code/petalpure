import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import StatusBadge from "@/components/admin/StatusBadge";

export const metadata = { title: "My orders | PetalPure" };
export const dynamic = "force-dynamic";

const rs = (n: number) => `Rs. ${n.toLocaleString("en-LK")}`;

export default async function MyOrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/orders");

  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div>
      <h1 className="text-4xl font-semibold">My orders</h1>
      {orders.length === 0 ? (
        <p className="mt-6 text-muted">
          No orders yet. <Link href="/products" className="font-medium text-rose-600 hover:underline">Start shopping →</Link>
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/order/${o.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-blush-100 bg-white p-4 transition hover:border-rose-500/40"
              >
                <div>
                  <p className="font-medium">{o.orderNumber}</p>
                  <p className="text-xs text-muted">{o.createdAt.toLocaleDateString("en-LK")} · {o._count.items} item(s)</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge value={o.status} />
                  <span className="font-medium">{rs(Number(o.total))}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}