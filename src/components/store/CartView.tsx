"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart, type FreshVariant } from "@/store/cartStore";
import { SHIPPING_FEE } from "@/lib/constants";
import { useHydrated } from "@/lib/useHydrated";

const rs = (n: number) => `Rs. ${n.toLocaleString("en-LK")}`;

export default function CartView() {
  const { items, setQty, remove, clear, sync } = useCart();
  const mounted = useHydrated();
  const [notices, setNotices] = useState<string[]>([]);

  useEffect(() => {
    const current = useCart.getState().items;
    if (current.length === 0) return;

    fetch("/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: current.map((i) => ({ variantId: i.variantId, qty: i.qty })) }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { variants: FreshVariant[] } | null) => {
        if (!data) return;
        const msgs: string[] = [];
        for (const i of current) {
          const f = data.variants.find((v) => v.variantId === i.variantId);
          if (!f || !f.available || f.stock === 0) {
            msgs.push(`${i.name} (${i.variantLabel}) is no longer available and was removed.`);
            continue;
          }
          if (f.price !== i.price) msgs.push(`The price of ${i.name} (${i.variantLabel}) changed to ${rs(f.price)}.`);
          if (f.stock < i.qty) msgs.push(`Only ${f.stock} of ${i.name} (${i.variantLabel}) left, so we reduced your quantity.`);
        }
        sync(data.variants);
        setNotices(msgs);
      })
      .catch(() => {});
  }, [sync]);

  if (!mounted) return <p className="py-16 text-center text-muted">Loading your cart…</p>;

  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);

  return (
    <div>
      <h1 className="text-4xl font-semibold">Your cart</h1>

      {notices.length > 0 && (
        <ul role="status" className="mt-4 space-y-1 rounded-lg bg-blush-50 px-4 py-3 text-sm text-rose-600">
          {notices.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}

      {items.length === 0 ? (
        <div className="mt-8 rounded-card border border-blush-100 bg-white px-6 py-14 text-center">
          <p className="font-serif text-2xl">Your cart is empty</p>
          <p className="mt-1 text-sm text-muted">Find something gentle for your skin.</p>
          <Link href="/products" className="mt-5 inline-block rounded-full bg-rose-500 px-6 py-2.5 font-medium text-white transition hover:bg-rose-600">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.variantId} className="flex gap-4 rounded-card border border-blush-100 bg-white p-4">
                <Link href={`/products/${i.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-blush-50">
                  {i.image && <Image src={i.image} alt={i.name} fill sizes="80px" className="object-cover" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <div>
                      <Link href={`/products/${i.slug}`} className="font-medium hover:text-rose-600">{i.name}</Link>
                      <p className="text-sm text-muted">{i.variantLabel} · {rs(i.price)}</p>
                    </div>
                    <p className="whitespace-nowrap font-medium">{rs(i.price * i.qty)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-blush-200">
                      <button aria-label={`Decrease ${i.name}`} onClick={() => setQty(i.variantId, i.qty - 1)} className="h-8 w-8">−</button>
                      <span className="w-7 text-center text-sm">{i.qty}</span>
                      <button
                        aria-label={`Increase ${i.name}`}
                        disabled={i.qty >= i.stock}
                        onClick={() => setQty(i.variantId, i.qty + 1)}
                        className="h-8 w-8 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <button onClick={() => remove(i.variantId)} className="text-sm text-muted hover:text-rose-600 hover:underline">
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-card border border-blush-100 bg-white p-5">
            <h2 className="text-xl font-semibold">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{rs(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{rs(SHIPPING_FEE)}</dd></div>
              <div className="flex justify-between border-t border-blush-100 pt-3 text-base font-semibold">
                <dt>Total</dt><dd>{rs(subtotal + SHIPPING_FEE)}</dd>
              </div>
            </dl>
            <Link href="/checkout" className="mt-5 block rounded-full bg-rose-500 py-3 text-center font-medium text-white transition hover:bg-rose-600">
              Checkout
            </Link>
            <button onClick={clear} className="mt-3 w-full text-sm text-muted hover:text-rose-600 hover:underline">
              Clear cart
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}