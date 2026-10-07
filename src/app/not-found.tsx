import Link from "next/link";

export const metadata = { title: "Page not found | PetalPure" };

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-blush-50 px-4 text-center">
      <p className="text-sm uppercase tracking-widest text-rose-600">404</p>
      <h1 className="mt-2 text-5xl font-semibold">We couldn&apos;t find that page</h1>
      <p className="mt-3 max-w-md text-muted">The link may be broken, or the product may no longer be available.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="rounded-full bg-rose-500 px-6 py-2.5 font-medium text-white transition hover:bg-rose-600">
          Back home
        </Link>
        <Link href="/products" className="rounded-full border border-blush-200 bg-white px-6 py-2.5 font-medium transition hover:text-rose-600">
          Shop products
        </Link>
      </div>
    </main>
  );
}