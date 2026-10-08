import { describe, it, expect } from "vitest";
import { NEXT_STATUSES } from "../src/lib/orders";

describe("order status workflow", () => {
  it("has no way out of final states", () => {
    expect(NEXT_STATUSES.DELIVERED).toEqual([]);
    expect(NEXT_STATUSES.CANCELLED).toEqual([]);
  });

  it("does not allow skipping steps", () => {
    expect(NEXT_STATUSES.PENDING).not.toContain("SHIPPED");
    expect(NEXT_STATUSES.PROCESSING).not.toContain("DELIVERED");
  });

  it("allows cancelling only before shipping", () => {
    expect(NEXT_STATUSES.PENDING).toContain("CANCELLED");
    expect(NEXT_STATUSES.PROCESSING).toContain("CANCELLED");
    expect(NEXT_STATUSES.SHIPPED).not.toContain("CANCELLED");
  });
});