"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/store/cartStore";

type V = { id: string; label: string; price: number; stock: number };

type Props = {
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  description: string;
  images: string[];
  variants: V[];
};

const rs = (n: number) => `Rs. ${n.toLocaleString("en-LK")}`;

export default function ProductDetail({ slug, name, brand, category, description, images, variants }: Props) {
  const add = useCart((s) => s.add);
  const [variantId, setVariantId] = useState((variants.find((v) => v.stock > 0) ?? variants[0]).id);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [added, setAdded] = useState(false);

  const variant = variants.find((v) => v.id === variantId)!;
  const soldOut = variant.stock === 0;
  const maxQty = Math.min(variant.stock, 10);

  function addToCart() {
    add(
      {
        variantId: variant.id,
        slug,
        name,
        variantLabel: variant.label,
        price: variant.price,
        image: images[0] ?? null,
        stock: variant.stock,
      },
      qty,
    );
    setAdded(true);
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <div className="relative aspect-square overflow-hidden rounded-card bg-blush-50">
          {images[img] ? (
            <Image src={images[img]} alt={name} fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-serif text-3xl text-rose-500/60">PetalPure</div>
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {images.map((url, i) => (
              <button
                key={url}
                onClick={() => setImg(i)}
                aria-label={`Show image ${i + 1}`}
                className={`relative aspect-square overflow-hidden rounded-xl border-2 ${
                  i === img ? "border-rose-500" : "border-transparent"
                }`}
              >
                <Image src={url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-muted">
          {category}
          {brand ? ` · ${brand}` : ""}
        </p>
        <h1 className="mt-1 text-4xl font-semibold leading-tight">{name}</h1>
        <p className="mt-3 text-2xl text-rose-600">{rs(variant.price)}</p>

        <fieldset className="mt-6">
          <legend className="mb-2 text-sm font-medium">Size / option</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setVariantId(v.id);
                  setQty(1);
                  setAdded(false);
                }}
                aria-pressed={v.id === variantId}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  v.id === variantId
                    ? "border-rose-500 bg-rose-500 text-white"
                    : "border-blush-200 bg-white hover:border-rose-500/50"
                } ${v.stock === 0 ? "line-through opacity-60" : ""}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </fieldset>

        <p className="mt-4 text-sm">
          {soldOut ? (
            <span className="text-rose-600">Sold out</span>
          ) : variant.stock <= 5 ? (
            <span className="text-rose-600">Only {variant.stock} left</span>
          ) : (
            <span className="text-ink">In stock</span>
          )}
        </p>

        <div className="mt-5 flex items-center gap-4">
          <div className="flex items-center rounded-full border border-blush-200 bg-white">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={soldOut || qty <= 1}
              onClick={() => setQty((q) => q - 1)}
              className="h-10 w-10 text-lg disabled:opacity-40"
            >
              −
            </button>
            <span className="w-8 text-center" aria-live="polite">{soldOut ? 0 : qty}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={soldOut || qty >= maxQty}
              onClick={() => setQty((q) => q + 1)}
              className="h-10 w-10 text-lg disabled:opacity-40"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={addToCart}
            disabled={soldOut}
            className="flex-1 rounded-full bg-rose-500 px-6 py-3 font-medium text-white transition hover:bg-rose-600 disabled:opacity-50 sm:flex-none"
          >
            {soldOut ? "Sold out" : "Add to cart"}
          </button>
        </div>

        {added && (
          <p role="status" className="mt-4 rounded-lg bg-sage-100 px-3 py-2 text-sm">
            Added to your cart.{" "}
            <Link href="/cart" className="font-medium text-rose-600 hover:underline">View cart →</Link>
          </p>
        )}

        <div className="mt-8 border-t border-blush-100 pt-6">
          <h2 className="text-xl font-semibold">About this product</h2>
          <p className="mt-2 whitespace-pre-line text-muted">{description}</p>
        </div>
      </div>
    </div>
  );
}