import { describe, expect, it } from "vitest";
import { discountPercent } from "@/modules/catalogue/helpers";

describe("product card pricing helpers", () => {
  it("computes discount only when MRP exceeds price", () => {
    expect(discountPercent(10000, 8000)).toBe(20);
    expect(discountPercent(8000, 8000)).toBeNull();
    expect(discountPercent(0, 8000)).toBeNull();
  });
});
