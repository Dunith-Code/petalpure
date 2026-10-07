import Link from "next/link";
import Image from "next/image";

export type CardProduct = {
  slug: string;
  name: string;
  category: string;
  image: string | null;
  minPrice: number;
  maxPrice: number;
  soldOut: boolean;
};

const rs = (n: number) => `Rs. ${n.toLocaleString("en-LK")}`;

export default function ProductCard({ p }: { p: CardProduct }) {
  return (
    <Link
      href={`/products/${p.slug}`}
      className="group overflow-hidden rounded-card border border-blush-100 bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-square bg-blush-50">
        {p.image ? (
          <Image
            src={p.image}
            alt={p.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-2xl text-rose-500/60">PetalPure</div>
        )}
        {p.soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-muted">
            Sold out
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted">{p.category}</p>
        <h3 className="mt-1 font-sans text-base font-medium leading-snug">{p.name}</h3>
        <p className="mt-2 text-sm text-rose-600">
          {p.minPrice === p.maxPrice ? rs(p.minPrice) : `From ${rs(p.minPrice)}`}
        </p>
      </div>
    </Link>
  );
}