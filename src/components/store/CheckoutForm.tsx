"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cartStore";
import { SHIPPING_FEE } from "@/lib/constants";
import { startPayHere } from "@/lib/payhereClient";

const rs = (n: number) => `Rs. ${n.toLocaleString("en-LK")}`;
const field =
  "w-full rounded-xl border border-blush-200 bg-white px-3 py-2.5 text-ink focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-blush-200";
const labelCls = "mb-1 block text-sm font-medium";

type Method = "PAYHERE" | "WHATSAPP";

export default function CheckoutForm({ defaults }: { defaults: { name: string; email: string } }) {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const [mounted, setMounted] = useState(false);
  const [method, setMethod] = useState<Method>("PAYHERE");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <p className="py-16 text-center text-muted">Loading…</p>;

  if (items.length === 0 && !done) {
    return (
      <div className="rounded-card border border-blush-100 bg-white px-6 py-14 text-center">
        <p className="font-serif text-2xl">Your cart is empty</p>
        <Link href="/products" className="mt-4 inline-block font-medium text-rose-600 hover:underline">
          Browse products →
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          paymentMethod: method,
          items: items.map((i) => ({ variantId: i.variantId, qty: i.qty })), // prices are never sent
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Something went wrong");
        setBusy(false);
        return;
      }
      setDone(true);
      clear();

      if (method === "PAYHERE") {
        try {
          await startPayHere(json.orderId); // navigates away to PayHere
          return;
        } catch {
          // The order is saved; the confirmation page offers a "Pay now" button
        }
      }
      router.push(`/order/${json.orderId}`);
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  const option = (value: Method, title: string, text: string) => (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
        method === value ? "border-rose-500 bg-blush-50" : "border-blush-200 bg-white"
      }`}
    >
      <input
        type="radio"
        name="method"
        checked={method === value}
        onChange={() => setMethod(value)}
        className="mt-1 accent-rose-500"
      />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted">{text}</span>
      </span>
    </label>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <form onSubmit={submit} className="space-y-4 rounded-card border border-blush-100 bg-white p-6" noValidate>
        <h2 className="text-2xl font-semibold">Delivery details</h2>

        <div>
          <label htmlFor="customerName" className={labelCls}>Full name</label>
          <input id="customerName" name="customerName" autoComplete="name" defaultValue={defaults.name} required className={field} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className={labelCls}>Phone</label>
            <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="0771234567" required className={field} />
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>Email{method === "PAYHERE" ? "" : " (optional)"}</label>
            <input id="email" name="email" type="email" autoComplete="email" defaultValue={defaults.email} className={field} />
          </div>
        </div>
        <div>
          <label htmlFor="address" className={labelCls}>Delivery address</label>
          <input id="address" name="address" autoComplete="street-address" required className={field} />
        </div>
        <div>
          <label htmlFor="city" className={labelCls}>City</label>
          <input id="city" name="city" autoComplete="address-level2" required className={field} />
        </div>

        <fieldset className="space-y-2 pt-2">
          <legend className="mb-1 text-sm font-medium">Payment method</legend>
          {option("PAYHERE", "Pay online with PayHere", "Card payment on PayHere's secure page.")}
          {option("WHATSAPP", "Order via WhatsApp", "We save your order, then you send it to us on WhatsApp to arrange payment.")}
        </fieldset>

        {error && (
          <div role="alert" className="rounded-lg bg-blush-50 px-3 py-2 text-sm text-rose-600">
            {error}{" "}
            <Link href="/cart" className="font-medium underline">Review cart</Link>
          </div>
        )}

        <button
          disabled={busy}
          className="w-full rounded-full bg-rose-500 py-3 font-medium text-white transition hover:bg-rose-600 disabled:opacity-60"
        >
          {busy ? "Placing your order…" : method === "PAYHERE" ? "Place order and pay" : "Place order and send on WhatsApp"}
        </button>
      </form>

      <aside className="h-fit rounded-card border border-blush-100 bg-white p-5">
        <h2 className="text-xl font-semibold">Order summary</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.variantId} className="flex justify-between gap-3">
              <span>{i.name} <span className="text-muted">({i.variantLabel}) × {i.qty}</span></span>
              <span className="whitespace-nowrap">{rs(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-blush-100 pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{rs(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{rs(SHIPPING_FEE)}</dd></div>
          <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{rs(subtotal + SHIPPING_FEE)}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-muted">Final prices are confirmed by our server when you place the order.</p>
      </aside>
    </div>
  );
}