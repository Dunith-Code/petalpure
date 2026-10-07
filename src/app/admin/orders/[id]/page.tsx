import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import StatusBadge from "@/components/admin/StatusBadge";
import OrderControls from "@/components/admin/OrderControls";
import type { OrderStatusT, PaymentStatusT } from "@/lib/orders";

export const dynamic = "force-dynamic";

const rs = (n: number) => `Rs. ${n.toLocaleString("en-LK")}`;

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  return (
    <div className="max-w-4xl">
      <Link href="/admin/orders" className="text-sm text-muted hover:text-rose-600">← All orders</Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">{order.orderNumber}</h1>
        <StatusBadge value={order.status} />
      </div>
      <p className="mt-1 text-sm text-muted">Placed {order.createdAt.toLocaleString("en-LK")}</p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-card border border-blush-100 bg-white p-5">
          <h2 className="text-xl font-semibold">Customer</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="text-muted">Name</dt><dd>{order.customerName}</dd></div>
            <div><dt className="text-muted">Phone</dt><dd>{order.phone}</dd></div>
            {order.email && <div><dt className="text-muted">Email</dt><dd>{order.email}</dd></div>}
            <div><dt className="text-muted">Delivery address</dt><dd>{order.address}, {order.city}</dd></div>
          </dl>
        </section>

        <section className="rounded-card border border-blush-100 bg-white p-5">
          <h2 className="text-xl font-semibold">Payment</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="text-muted">Method</dt><dd>{order.paymentMethod === "PAYHERE" ? "PayHere (online)" : "WhatsApp order"}</dd></div>
            <div><dt className="text-muted">Status</dt><dd><StatusBadge value={order.paymentStatus} /></dd></div>
          </dl>
          <div className="mt-5 border-t border-blush-100 pt-5">
            <OrderControls
              orderId={order.id}
              status={order.status as OrderStatusT}
              paymentStatus={order.paymentStatus as PaymentStatusT}
            />
          </div>
        </section>
      </div>

      <section className="mt-6 overflow-x-auto rounded-card border border-blush-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-blush-50 text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Unit price</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 text-right font-medium">Line total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id} className="border-t border-blush-100">
                <td className="px-4 py-3">{i.productName} <span className="text-muted">({i.variantLabel})</span></td>
                <td className="whitespace-nowrap px-4 py-3">{rs(Number(i.unitPrice))}</td>
                <td className="px-4 py-3">{i.quantity}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">{rs(Number(i.unitPrice) * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-blush-100 text-sm">
            <tr><td colSpan={3} className="px-4 pt-3 text-right text-muted">Subtotal</td><td className="px-4 pt-3 text-right">{rs(Number(order.subtotal))}</td></tr>
            <tr><td colSpan={3} className="px-4 py-1 text-right text-muted">Delivery</td><td className="px-4 py-1 text-right">{rs(Number(order.shipping))}</td></tr>
            <tr><td colSpan={3} className="px-4 pb-3 text-right font-semibold">Total</td><td className="px-4 pb-3 text-right font-semibold">{rs(Number(order.total))}</td></tr>
          </tfoot>
        </table>
      </section>
    </div>
  );
}