import { describe, expect, it } from "vitest";
import { createProductOfferSchema } from "@/modules/catalogue/schema";
import { SEED_MULTI_SELLER_OFFERS, SEED_PRODUCT_BASE } from "@/modules/catalogue/seed-catalogue-data";

describe("multi-seller offers", () => {
  it("accepts a valid offer payload", () => {
    const parsed = createProductOfferSchema.parse({
      sellerId: "11111111-1111-4111-8111-111111111111",
      sourceProductId: "22222222-2222-4222-8222-222222222222",
      variant: {
        sku: "TOWEL-SET-B",
        mrpPaise: 59900,
        sellingPricePaise: 39900,
        initialStock: 12,
      },
    });
    expect(parsed.variant.sku).toBe("TOWEL-SET-B");
  });

  it("rejects offer when MRP is below selling price", () => {
    const result = createProductOfferSchema.safeParse({
      sellerId: "11111111-1111-4111-8111-111111111111",
      sourceProductId: "22222222-2222-4222-8222-222222222222",
      variant: {
        sku: "TOWEL-SET-B",
        mrpPaise: 30000,
        sellingPricePaise: 39900,
        initialStock: 12,
      },
    });
    expect(result.success).toBe(false);
  });

  it("seeds at least three shared listing groups with multiple sellers", () => {
    const keyed = [...SEED_PRODUCT_BASE, ...SEED_MULTI_SELLER_OFFERS].filter(
      (item) => item.sharedListingKey,
    );
    const byKey = new Map<string, Set<string>>();
    for (const item of keyed) {
      const key = item.sharedListingKey!;
      const sellers = byKey.get(key) ?? new Set<string>();
      sellers.add(item.sellerKey);
      byKey.set(key, sellers);
    }
    expect(byKey.size).toBeGreaterThanOrEqual(3);
    for (const sellers of byKey.values()) {
      expect(sellers.size).toBeGreaterThanOrEqual(2);
    }
  });
});
