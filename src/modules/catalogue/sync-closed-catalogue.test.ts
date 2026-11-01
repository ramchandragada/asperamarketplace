import { describe, expect, it } from "vitest";
import { PC_PRODUCTS } from "@/modules/catalogue/pc-catalogue-data";

describe("closed catalogue sync coverage", () => {
  it("has a non-empty PC seed to publish for sellers", () => {
    expect(PC_PRODUCTS.length).toBeGreaterThanOrEqual(300);
    const skus = new Set(PC_PRODUCTS.map((row) => row.sku));
    const slugs = new Set(PC_PRODUCTS.map((row) => row.slug));
    expect(skus.size).toBe(PC_PRODUCTS.length);
    expect(slugs.size).toBe(PC_PRODUCTS.length);
  });
});
