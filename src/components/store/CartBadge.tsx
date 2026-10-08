"use client";

import Link from "next/link";
import { useCart } from "@/store/cartStore";
import { useHydrated } from "@/lib/useHydrated";

export default function CartBadge() {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const mounted = useHydrated();

  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${mounted ? count : 0} items`}
      className="relative rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-blush-50 hover:text-rose-600"
    >
      Cart
      {mounted && count > 0 && (
        <span className="ml-1.5 rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">{count}</span>
      )}
    </Link>
  );
}