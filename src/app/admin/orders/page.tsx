import Link from "next/link";
import type { Prisma, OrderStatus, PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ORDER_STATUSES, PAYMENT_METHODS, STATUS_LABEL } from "@/lib/orders";
import StatusBadge from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;
const rs = (n: number) => `Rs. ${n.toLocaleString("en-LK")}`;

type SP = { status?: string; method?: string; q?: string; page?: string };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = ORDER_STATUSES.find((s) => s === sp.status);
  const method = PAYMENT_METHODS.find((m) => m === sp.method);
  const q = (sp.q ?? "").trim().slice(0, 60);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status: status as OrderStatus } : {}),
    ...(method ? { paymentMethod: method as PaymentMethod } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" } },
            { customerName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { items: true } } },
    }),
    prisma.order.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function href(p: number) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (method) params.set("method", method);
    if (q) params.set("q", q);
    params.set("page", String(p));
    return `/admin/orders?${params.toString()}`;
  }

  const field =
    "rounded-xl border border-blush-200 bg-white px-3 py-2 text-ink focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-blush-200";

  return (
    <div>
      <h1 className="text-3xl font-semibold">Orders</h1>
      <p className="mt-1 text-sm text-muted">{total} order(s)</p>

      <form className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input name="q" defaultValue={q} placeholder="Order no., name or phone" aria-label="Search orders" className={`${field} sm:w-64`} />
        <select name="status" defaultValue={status ?? ""} aria-label="Filter by status" className={field}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        <select name="method" defaultValue={method ?? ""} aria-label="Filter by payment method" className={field}>
          <option value="">All payment methods</option>
          <option value="PAYHERE">PayHere</option>
          <option value="WHATSAPP">WhatsApp</option>
        </select>
        <button className="rounded-xl bg-rose-500 px-5 py-2 font-medium text-white transition hover:bg-rose-600">Filter</button>
        {(status || method || q) && (
          <Link href="/admin/orders" className="self-center text-sm text-muted hover:text-rose-600">Clear</Link>
        )}
      </form>

      <div className="mt-6 overflow-x-auto rounded-card border border-blush-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-blush-50 text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium"> </th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">No orders found.</td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-blush-100 align-top">
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="font-medium">{o.orderNumber}</p>
                  <p className="text-xs text-muted">{o.createdAt.toLocaleDateString("en-LK")}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{o.customerName}</p>
                  <p className="text-xs text-muted">{o.phone}</p>
                </td>
                <td className="px-4 py-3">{o._count.items}</td>
                <td className="whitespace-nowrap px-4 py-3">{rs(Number(o.total))}</td>
                <td className="px-4 py-3">
                  <p className="text-xs text-muted">{o.paymentMethod === "PAYHERE" ? "PayHere" : "WhatsApp"}</p>
                  <StatusBadge value={o.paymentStatus} />
                </td>
                <td className="px-4 py-3"><StatusBadge value={o.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium text-rose-600 hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={href(page - 1)} className="text-rose-600 hover:underline">← Previous</Link> : <span />}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages ? <Link href={href(page + 1)} className="text-rose-600 hover:underline">Next →</Link> : <span />}
        </div>
      )}
    </div>
  );
}