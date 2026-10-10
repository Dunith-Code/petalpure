import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildOrderMessage, whatsappLink } from "@/lib/whatsapp";
import PayNowButton from "@/components/store/PayNowButton";
import AutoRefresh from "@/components/store/AutoRefresh";
import ClearCartWhenPaid from "@/components/store/ClearCartWhenPaid";

export const metadata = { title: "Your order | PetalPure" };
export const dynamic = "force-dynamic";

const rs = (n: number) => `Rs. ${n.toLocaleString("en-LK")}`;

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  // The id is an unguessable cuid, so only the person who placed the order has the link
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  const isPayHere = order.paymentMethod === "PAYHERE";
  const paid = order.paymentStatus === "PAID";
  const closed = order.status === "CANCELLED";
  const canPay = isPayHere && !paid && !closed;
  const cancelledAtPayHere = sp.cancelled === "1";

  // Built for every order: WhatsApp orders use it as the main step, and
  // unpaid PayHere orders offer it as a fallback
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const link = number
    ? whatsappLink(
        number,
        buildOrderMessage({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          phone: order.phone,
          address: order.address,
          city: order.city,
          subtotal: Number(order.subtotal),
          shipping: Number(order.shipping),
          total: Number(order.total),
          items: order.items,
        }),
      )
    : null;

  return (
    <div className="mx-auto max-w-2xl">
      {/* The cart is only emptied once payment is confirmed, so going back never loses it */}
      {paid && <ClearCartWhenPaid />}

      <div className="rounded-card bg-sage-100 px-6 py-8 text-center">
        <p className="text-sm uppercase tracking-widest text-ink/70">{paid ? "Payment received" : "Order saved"}</p>
        <h1 className="mt-1 text-4xl font-semibold">Thank you, {order.customerName.split(" ")[0]}!</h1>
        <p className="mt-2">Your order number is <strong>{order.orderNumber}</strong></p>
      </div>

      {!isPayHere && (
        <div className="mt-6 rounded-card border border-blush-100 bg-white p-6 text-center">
          <h2 className="text-2xl font-semibold">One last step</h2>
          <p className="mt-1 text-sm text-muted">
            Send your order to us on WhatsApp so we can confirm it and arrange payment.
          </p>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-full bg-rose-500 px-8 py-3 font-medium text-white transition hover:bg-rose-600"
            >
              Send order on WhatsApp
            </a>
          ) : (
            <p className="mt-4 rounded-lg bg-blush-50 px-3 py-2 text-sm text-rose-600">
              WhatsApp isn&apos;t configured yet. Please contact us and quote {order.orderNumber}.
            </p>
          )}
        </div>
      )}

      {isPayHere && (
        <div className="mt-6 rounded-card border border-blush-100 bg-white p-6 text-center" aria-live="polite">
          {paid && closed ? (
            <>
              <h2 className="text-2xl font-semibold">We received your payment</h2>
              <p className="mt-1 text-sm text-muted">
                Your order had expired before payment arrived. Please contact us and quote {order.orderNumber}, and we&apos;ll sort it out.
              </p>
            </>
          ) : paid ? (
            <>
              <h2 className="text-2xl font-semibold">Payment received</h2>
              <p className="mt-1 text-sm text-muted">We&apos;ll start preparing your order right away.</p>
            </>
          ) : closed ? (
            <>
              <h2 className="text-2xl font-semibold">Order cancelled</h2>
              <p className="mt-1 text-sm text-muted">
                Payment wasn&apos;t completed in time, so the items went back to stock. You&apos;re welcome to place a new order.
              </p>
            </>
          ) : cancelledAtPayHere ? (
            <>
              <h2 className="text-2xl font-semibold">Payment cancelled</h2>
              <p className="mt-1 text-sm text-muted">Your items are held for a short time. You can try again.</p>
              <div className="mt-4 flex justify-center"><PayNowButton orderId={order.id} label="Try payment again" /></div>
            </>
          ) : (
            <>
              <AutoRefresh />
              <h2 className="text-2xl font-semibold">Confirming your payment…</h2>
              <p className="mt-1 text-sm text-muted">
                This usually takes a few seconds. If you haven&apos;t paid yet, you can do it now.
              </p>
              <div className="mt-4 flex justify-center"><PayNowButton orderId={order.id} /></div>
            </>
          )}
          {canPay && <p className="mt-3 text-xs text-muted">Payments are processed securely by PayHere.</p>}
          {canPay && link && (
            <p className="mt-4 text-sm text-muted">
              Having trouble paying online?{" "}
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-rose-600 hover:underline"
              >
                Send this order on WhatsApp instead
              </a>
            </p>
          )}
        </div>
      )}

      <section className="mt-6 overflow-x-auto rounded-card border border-blush-100 bg-white">
        <table className="w-full text-left text-sm">
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id} className="border-b border-blush-100">
                <td className="px-4 py-3">{i.productName} <span className="text-muted">({i.variantLabel}) × {i.quantity}</span></td>
                <td className="whitespace-nowrap px-4 py-3 text-right">{rs(Number(i.unitPrice) * i.quantity)}</td>
              </tr>
            ))}
            <tr><td className="px-4 pt-3 text-muted">Subtotal</td><td className="px-4 pt-3 text-right">{rs(Number(order.subtotal))}</td></tr>
            <tr><td className="px-4 py-1 text-muted">Delivery</td><td className="px-4 py-1 text-right">{rs(Number(order.shipping))}</td></tr>
            <tr className="font-semibold"><td className="px-4 pb-3">Total</td><td className="px-4 pb-3 text-right">{rs(Number(order.total))}</td></tr>
          </tbody>
        </table>
      </section>

      <p className="mt-4 text-center text-sm text-muted">Delivering to {order.address}, {order.city}</p>
      <p className="mt-6 text-center">
        <Link href="/products" className="font-medium text-rose-600 hover:underline">Continue shopping →</Link>
      </p>
    </div>
  );
}