import { describe, expect, it } from "vitest";
import {
  SEED_BRANDS,
  SEED_CATEGORIES,
  SEED_PRODUCTS,
} from "./seed-catalogue-data";
import {
  CUSTOMER_BROWSE_HREFS,
  catalogueMatchCount,
} from "./seed-nav-lanes";

describe("shopper catalogue lanes", () => {
  it("gives every exposed browse target at least 10 approved products", () => {
    const short = CUSTOMER_BROWSE_HREFS.flatMap((href) => {
      const total = catalogueMatchCount(
        SEED_PRODUCTS,
        href,
        SEED_CATEGORIES,
        SEED_BRANDS,
      );
      return total < 10 ? [`${total} ${href}`] : [];
    });
    expect(short).toEqual([]);
  });

  it("keeps generated slugs unique", () => {
    const slugs = SEED_PRODUCTS.map((item) => item.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
