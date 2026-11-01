import { describe, expect, it } from "vitest";
import { uniqueTestGstin } from "@/modules/seller/test-gstin";
import { createSellerDraftSchema } from "@/modules/seller/schema";

describe("uniqueTestGstin", () => {
  it("produces schema-valid distinct GSTINs", () => {
    const a = uniqueTestGstin("seller-a");
    const b = uniqueTestGstin("seller-b");
    expect(a).not.toBe(b);
    expect(() =>
      createSellerDraftSchema.shape.gstin.parse(a),
    ).not.toThrow();
    expect(() =>
      createSellerDraftSchema.shape.gstin.parse(b),
    ).not.toThrow();
  });
});
