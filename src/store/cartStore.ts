import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  variantId: string;
  slug: string;
  name: string;
  variantLabel: string;
  price: number;
  image: string | null;
  qty: number;
  stock: number;
};

export type FreshVariant = {
  variantId: string;
  slug: string;
  name: string;
  image: string | null;
  variantLabel: string;
  price: number;
  stock: number;
  available: boolean;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  sync: (fresh: FreshVariant[]) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, stock: item.stock, price: item.price, qty: Math.min(i.qty + qty, item.stock) }
                  : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, qty: Math.min(qty, item.stock) }] };
        }),
      setQty: (variantId, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.variantId === variantId ? { ...i, qty: Math.max(0, Math.min(qty, i.stock)) } : i))
            .filter((i) => i.qty > 0),
        })),
      remove: (variantId) => set((s) => ({ items: s.items.filter((i) => i.variantId !== variantId) })),
      clear: () => set({ items: [] }),
      // Replace local prices and stock with the server's truth; drop items that are gone or sold out
      sync: (fresh) =>
        set((s) => ({
          items: s.items.flatMap((i) => {
            const f = fresh.find((x) => x.variantId === i.variantId);
            if (!f || !f.available || f.stock === 0) return [];
            return [
              {
                ...i,
                slug: f.slug,
                name: f.name,
                image: f.image,
                variantLabel: f.variantLabel,
                price: f.price,
                stock: f.stock,
                qty: Math.min(i.qty, f.stock),
              },
            ];
          }),
        })),
    }),
    { name: "petalpure-cart" },
  ),
);