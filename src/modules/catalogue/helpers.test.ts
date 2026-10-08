import { describe, expect, it } from "vitest";
import {
  assertProductTransition,
  buildSearchDocument,
  canTransitionProductStatus,
  formatPaise,
  mergeVariantPrices,
  paiseFromRupees,
  rupeesFromPaise,
  slugify,
} from "@/modules/catalogue/helpers";

describe("catalogue helpers", () => {
  it("allows draft to submitted and submitted to approved", () => {
    expect(canTransitionProductStatus("draft", "submitted")).toBe(true);
    expect(canTransitionProductStatus("submitted", "approved")).toBe(true);
    expect(canTransitionProductStatus("rejected", "submitted")).toBe(true);
    expect(canTransitionProductStatus("approved", "submitted")).toBe(true);
    expect(canTransitionProductStatus("approved", "archived")).toBe(true);
  });

  it("throws on illegal product transitions", () => {
    expect(() => assertProductTransition("draft", "approved")).toThrow(
      /cannot move/,
    );
  });

  it("slugifies titles and builds search documents", () => {
    expect(slugify("Cotton Tea Towel Set!")).toBe("cotton-tea-towel-set");
    expect(
      buildSearchDocument({
        title: "Tea Towel",
        summary: "Kitchen linen",
        description: "Absorbent cotton",
        brandName: "Aspera Home",
        categoryName: "General merchandise",
        sku: "TOWEL-01",
      }),
    ).toContain("TOWEL-01");
  });

  it("formats paise as INR without trusting client math", () => {
    expect(formatPaise(19900)).toBe("₹199.00");
    expect(formatPaise(149900)).toBe("₹1,499.00");
  });

  it("converts rupees to paise for seller forms", () => {
    expect(paiseFromRupees(199)).toBe(19900);
    expect(paiseFromRupees(699.5)).toBe(69950);
    expect(rupeesFromPaise(19900)).toBe("199.00");
  });

  it("rejects selling-price-only PATCH above stored MRP", () => {
    const merged = mergeVariantPrices(
      { mrpPaise: 10000, sellingPricePaise: 8000 },
      { sellingPricePaise: 12000 },
    );
    expect(merged.withinMrp).toBe(false);
    expect(merged.mrpPaise).toBe(10000);
    expect(merged.sellingPricePaise).toBe(12000);
  });
});
