import { describe, it, expect } from "vitest";
import { createHash } from "crypto";
import { checkoutHash, notifySignature, formatAmount, safeEqual } from "../src/lib/payhere";

const md5 = (s: string) => createHash("md5").update(s).digest("hex");

describe("payhere", () => {
  it("formats amounts with exactly two decimals", () => {
    expect(formatAmount(1500)).toBe("1500.00");
    expect(formatAmount(10.5)).toBe("10.50");
  });

  it("builds the checkout hash from PayHere's documented formula", () => {
    const expected = md5("1230000" + "PP-ABC123" + "1850.00" + "LKR" + md5("secret").toUpperCase()).toUpperCase();
    expect(checkoutHash("1230000", "PP-ABC123", "1850.00", "LKR", "secret")).toBe(expected);
  });

  it("includes the status code in the callback signature", () => {
    const paid = notifySignature("1230000", "PP-ABC123", "1850.00", "LKR", "2", "secret");
    const failed = notifySignature("1230000", "PP-ABC123", "1850.00", "LKR", "-2", "secret");
    expect(paid).not.toBe(failed);
  });

  it("compares signatures case-insensitively and rejects different lengths", () => {
    expect(safeEqual("abc123", "ABC123")).toBe(true);
    expect(safeEqual("abc123", "abc1234")).toBe(false);
  });
});