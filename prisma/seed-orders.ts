import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SHIPPING = 350;

const samples = [
  {
    orderNumber: "PP-SEED-1001", customerName: "Nimali Perera", phone: "0771234567",
    address: "12 Galle Road", city: "Hikkaduwa",
    paymentMethod: "WHATSAPP" as const, paymentStatus: "PENDING" as const, status: "PENDING" as const,
    items: [{ sku: "RHFC-50", qty: 2 }, { sku: "SBL-300", qty: 1 }],
  },
  {
    orderNumber: "PP-SEED-1002", customerName: "Kasun Silva", phone: "0712345678",
    address: "45 Temple Lane", city: "Colombo 07",
    paymentMethod: "PAYHERE" as const, paymentStatus: "PAID" as const, status: "PROCESSING" as const,
    items: [{ sku: "ARS-250", qty: 1 }, { sku: "RHFC-100", qty: 1 }],
  },
  {
    orderNumber: "PP-SEED-1003", customerName: "Dilini Fernando", phone: "0755551234",
    address: "8 Lake Road", city: "Kandy",
    paymentMethod: "PAYHERE" as const, paymentStatus: "PAID" as const, status: "DELIVERED" as const,
    items: [{ sku: "SBL-300", qty: 3 }],
  },
];

async function main() {
  for (const s of samples) {
    if (await prisma.order.findUnique({ where: { orderNumber: s.orderNumber } })) continue;

    const variants = await prisma.productVariant.findMany({
      where: { sku: { in: s.items.map((i) => i.sku) } },
      include: { product: true },
    });

    const items = s.items.map((i) => {
      const v = variants.find((x) => x.sku === i.sku);
      if (!v) throw new Error(`Missing variant ${i.sku}. Run the main seed first.`);
      return {
        variantId: v.id,
        productName: v.product.name,
        variantLabel: v.label,
        unitPrice: v.price,
        quantity: i.qty,
      };
    });

    const subtotal = items.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0);
    const { items: _skip, ...order } = s;

    await prisma.order.create({
      data: {
        ...order,
        subtotal,
        shipping: SHIPPING,
        total: subtotal + SHIPPING,
        items: { create: items },
      },
    });
  }
  console.log("Sample orders ready");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());