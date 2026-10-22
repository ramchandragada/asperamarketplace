import { describe, expect, it } from "vitest";
import { rankOffers, type OfferView } from "./catalogue-v2";

function offer(partial: Partial<OfferView> & { offerId: string }): OfferView {
  return {
    sellerId: "s",
    sellerName: "Seller",
    sellerVerified: true,
    catalogueVariantId: "v",
    variantTitle: "Default",
    sku: partial.offerId,
    condition: "new",
    sellingPricePaise: 10000,
    mrpPaise: 12000,
    availableQty: 5,
    dispatchDays: null,
    isFeatured: false,
    ...partial,
  };
}

describe("rankOffers", () => {
  it("features the lowest-price in-stock offer", () => {
    const ranked = rankOffers([
      offer({ offerId: "a", sellingPricePaise: 12000 }),
      offer({ offerId: "b", sellingPricePaise: 9000 }),
      offer({ offerId: "c", sellingPricePaise: 10000 }),
    ]);
    expect(ranked[0]?.offerId).toBe("b");
    expect(ranked.find((o) => o.isFeatured)?.offerId).toBe("b");
    expect(ranked.filter((o) => o.isFeatured)).toHaveLength(1);
  });

  it("sorts out-of-stock offers last and never features them", () => {
    const ranked = rankOffers([
      offer({ offerId: "cheap-oos", sellingPricePaise: 5000, availableQty: 0 }),
      offer({ offerId: "instock", sellingPricePaise: 9000, availableQty: 3 }),
    ]);
    expect(ranked[0]?.offerId).toBe("instock");
    expect(ranked.find((o) => o.isFeatured)?.offerId).toBe("instock");
  });

  it("breaks price ties by faster dispatch", () => {
    const ranked = rankOffers([
      offer({ offerId: "slow", sellingPricePaise: 9000, dispatchDays: 5 }),
      offer({ offerId: "fast", sellingPricePaise: 9000, dispatchDays: 1 }),
    ]);
    expect(ranked[0]?.offerId).toBe("fast");
  });

  it("features nothing when every offer is out of stock", () => {
    const ranked = rankOffers([
      offer({ offerId: "a", availableQty: 0 }),
      offer({ offerId: "b", availableQty: 0 }),
    ]);
    expect(ranked.some((o) => o.isFeatured)).toBe(false);
  });
});
