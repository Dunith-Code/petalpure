import Link from "next/link";
import { getSession } from "@/lib/auth";
import CartBadge from "./CartBadge";
import SignOutButton from "./SignOutButton";

const link = "rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-blush-50 hover:text-rose-600";

export default async function Header() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-30 border-b border-blush-100 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="font-serif text-3xl font-semibold text-rose-600">
          PetalPure
        </Link>

        <form
          action="/products"
          className="order-last w-full md:order-none md:ml-4 md:w-auto md:flex-1 md:max-w-md"
          role="search"
        >
          <input
            name="q"
            placeholder="Search skincare, hair care…"
            aria-label="Search products"
            className="w-full rounded-full border border-blush-200 bg-white px-4 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-blush-200"
          />
        </form>

        <nav className="ml-auto flex items-center gap-1">
          <Link href="/products" className={link}>Shop</Link>
          {session?.role === "ADMIN" && <Link href="/admin" className={link}>Admin</Link>}
          {session ? (
            <>
              <Link href="/account/orders" className={link}>My orders</Link>
              <SignOutButton />
            </>
          ) : (
            <Link href="/login" className={link}>Sign in</Link>
          )}
          <CartBadge />
        </nav>
      </div>
    </header>
  );
}