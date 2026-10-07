type MsgOrder = {
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  subtotal: number;
  shipping: number;
  total: number;
  items: { productName: string; variantLabel: string; quantity: number }[];
};

const rs = (n: number) => `Rs. ${n.toLocaleString("en-LK")}`;

export function buildOrderMessage(o: MsgOrder) {
  // Group variants under each product: "Rose Face Cream — 50ml × 2, 100ml × 1"
  const grouped = new Map<string, string[]>();
  for (const i of o.items) {
    const parts = grouped.get(i.productName) ?? [];
    parts.push(`${i.variantLabel} × ${i.quantity}`);
    grouped.set(i.productName, parts);
  }
  const lines = [...grouped].map(([name, parts]) => `• ${name} — ${parts.join(", ")}`);

  return [
    `🌸 New PetalPure order ${o.orderNumber}`,
    "",
    ...lines,
    "",
    `Subtotal: ${rs(o.subtotal)}`,
    `Delivery: ${rs(o.shipping)}`,
    `Total: ${rs(o.total)}`,
    "",
    `Name: ${o.customerName}`,
    `Phone: ${o.phone}`,
    `Address: ${o.address}, ${o.city}`,
    "",
    "Payment: to be arranged here (bank transfer or cash on delivery)",
  ].join("\n");
}

export function whatsappLink(number: string, text: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}