import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import CheckoutForm from "@/components/store/CheckoutForm";

export const metadata = { title: "Checkout | PetalPure" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await getSession();
  const user = session
    ? await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, email: true } })
    : null;

  return (
    <div>
      <h1 className="text-4xl font-semibold">Checkout</h1>
      <div className="mt-6">
        <CheckoutForm defaults={{ name: user?.name ?? "", email: user?.email ?? "" }} />
      </div>
    </div>
  );
}