import { describe, it, expect } from "vitest";
import { buildOrderMessage, whatsappLink } from "../src/lib/whatsapp";

const order = {
  orderNumber: "PP-TEST01",
  customerName: "Nimali Perera",
  phone: "0771234567",
  address: "12 Galle Road",
  city: "Hikkaduwa",
  subtotal: 8800,
  shipping: 350,
  total: 9150,
  items: [
    { productName: "Rose Hydrating Face Cream", variantLabel: "50ml", quantity: 2 },
    { productName: "Rose Hydrating Face Cream", variantLabel: "100ml", quantity: 1 },
    { productName: "Argan Repair Shampoo", variantLabel: "250ml", quantity: 1 },
  ],
};

describe("whatsapp message", () => {
  it("groups variants under their product", () => {
    const msg = buildOrderMessage(order);
    expect(msg).toContain("• Rose Hydrating Face Cream — 50ml × 2, 100ml × 1");
    expect(msg).toContain("• Argan Repair Shampoo — 250ml × 1");
  });

  it("includes the order number, total and delivery details", () => {
    const msg = buildOrderMessage(order);
    expect(msg).toContain("PP-TEST01");
    expect(msg).toContain("9,150");
    expect(msg).toContain("12 Galle Road, Hikkaduwa");
  });

  it("builds a wa.me link with only digits in the number and an encoded text", () => {
    expect(whatsappLink("+94 77 123 4567", "hi there")).toBe("https://wa.me/94771234567?text=hi%20there");
  });
});