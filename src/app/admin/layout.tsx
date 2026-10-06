import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import LogoutButton from "@/components/admin/LogoutButton";

export const metadata = { title: "Admin | PetalPure" };

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/orders", label: "Orders" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Second layer of protection (the first is proxy.ts); also re-checks the DB role
  const session = await requireAdmin();
  if (!session) redirect("/login?next=/admin");

  return (
    <div className="min-h-screen bg-cream md:flex">
      <aside className="border-b border-blush-100 bg-white md:w-60 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-4 md:block">
          <Link href="/admin" className="font-serif text-2xl font-semibold text-rose-600">
            PetalPure
            <span className="ml-2 text-xs font-sans font-medium uppercase tracking-wide text-muted">
              Admin
            </span>
          </Link>
          <div className="md:hidden">
            <LogoutButton />
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-0">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink transition hover:bg-blush-50 hover:text-rose-600"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 hidden border-t border-blush-100 px-4 py-4 md:block">
          <p className="truncate text-sm font-medium">{session.name}</p>
          <p className="mb-2 text-xs text-muted">Administrator</p>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}