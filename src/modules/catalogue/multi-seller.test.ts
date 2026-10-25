import { describe, expect, it } from "vitest";
import { createProductOfferSchema } from "@/modules/catalogue/schema";
import { PC_PRODUCTS, PC_SELLERS } from "@/modules/catalogue/pc-catalogue-data";

describe("multi-seller offers", () => {
  it("accepts a valid offer payload", () => {
    const parsed = createProductOfferSchema.parse({
      sellerId: "11111111-1111-4111-8111-111111111111",
      sourceProductId: "22222222-2222-4222-8222-222222222222",
      variant: {
        sku: "GPU-RTX-B",
        mrpPaise: 5990000,
        sellingPricePaise: 5490000,
        initialStock: 12,
      },
    });
    expect(parsed.variant.sku).toBe("GPU-RTX-B");
  });

  it("rejects offer when MRP is below selling price", () => {
    const result = createProductOfferSchema.safeParse({
      sellerId: "11111111-1111-4111-8111-111111111111",
      sourceProductId: "22222222-2222-4222-8222-222222222222",
      variant: {
        sku: "GPU-RTX-B",
        mrpPaise: 30000,
        sellingPricePaise: 39900,
        initialStock: 12,
      },
    });
    expect(result.success).toBe(false);
  });

  it("PC catalogue distributes listings across multiple Pune sellers", () => {
    expect(PC_SELLERS.length).toBeGreaterThanOrEqual(3);
    const sellersWithStock = new Set(PC_PRODUCTS.map((item) => item.sellerKey));
    expect(sellersWithStock.size).toBeGreaterThanOrEqual(3);
  });
});
