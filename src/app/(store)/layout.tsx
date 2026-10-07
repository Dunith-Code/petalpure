import Link from "next/link";
import Header from "@/components/store/Header";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-rose-600"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-blush-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="font-serif text-xl text-rose-600">PetalPure</p>
          <nav className="flex gap-4">
            <Link href="/products" className="hover:text-rose-600">Shop</Link>
            <Link href="/cart" className="hover:text-rose-600">Cart</Link>
          </nav>
          <p>© {new Date().getFullYear()} PetalPure. Gentle beauty, made simply.</p>
        </div>
      </footer>
    </div>
  );
}