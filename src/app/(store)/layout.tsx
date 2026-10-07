import Link from "next/link";
import Header from "@/components/store/Header";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
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