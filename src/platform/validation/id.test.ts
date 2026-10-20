import { describe, expect, it } from "vitest";
import { dbUuid, isDbUuid } from "@/platform/validation/id";
import { assertUuid, isUuid } from "@/platform/http/errors";
import {
  createProductOfferSchema,
  createProductSchema,
  updateSellerProductSchema,
} from "@/modules/catalogue/schema";
import { reviewSellerSchema } from "@/modules/seller/schema";
import { shipGroupSchema } from "@/modules/fulfilment/schema";

/** Seed-style id: version/variant nibble is 0 (rejected by strict z.uuid()). */
const LOOSE_ID = "8670a3ca-0000-0000-0000-000000000001";
const LOOSE_CATEGORY = "8670a3ca-1111-0000-0000-000000000002";
const LOOSE_PRODUCT = "8670a3ca-2222-0000-0000-000000000003";
const LOOSE_VARIANT = "8670a3ca-3333-0000-0000-000000000004";
const LOOSE_GROUP = "8670a3ca-4444-0000-0000-000000000005";

describe("dbUuid / assertUuid", () => {
  it("accepts non-RFC4122 hex UUIDs used by seed sellers", () => {
    expect(isDbUuid(LOOSE_ID)).toBe(true);
    expect(isUuid(LOOSE_ID)).toBe(true);
    expect(() => assertUuid(LOOSE_ID, "sellerId")).not.toThrow();
    expect(dbUuid.parse(LOOSE_ID)).toBe(LOOSE_ID);
  });

  it("rejects non-UUID strings", () => {
    expect(isDbUuid("not-a-uuid")).toBe(false);
    expect(dbUuid.safeParse("nav-1og").success).toBe(false);
  });
});

describe("seller/admin schemas accept loose DB ids", () => {
  it("create product", () => {
    const parsed = createProductSchema.parse({
      sellerId: LOOSE_ID,
      categoryId: LOOSE_CATEGORY,
      title: "Loose-id listing title",
      summary: "Summary long enough for schema.",
      description: "Description long enough for the catalogue create schema rules.",
      variant: {
        sku: "LOOSE-SKU-01",
        title: "Default",
        mrpPaise: 10000,
        sellingPricePaise: 8000,
        initialStock: 2,
      },
    });
    expect(parsed.sellerId).toBe(LOOSE_ID);
  });

  it("create offer", () => {
    const parsed = createProductOfferSchema.parse({
      sellerId: LOOSE_ID,
      sourceProductId: LOOSE_PRODUCT,
      variant: {
        sku: "LOOSE-OFFER-01",
        mrpPaise: 10000,
        sellingPricePaise: 8000,
        initialStock: 2,
      },
    });
    expect(parsed.sourceProductId).toBe(LOOSE_PRODUCT);
  });

  it("patch stock / price / content", () => {
    const stock = updateSellerProductSchema.parse({
      sellerId: LOOSE_ID,
      productId: LOOSE_PRODUCT,
      variant: { id: LOOSE_VARIANT, onHand: 12 },
    });
    expect(stock.variant?.onHand).toBe(12);

    const price = updateSellerProductSchema.parse({
      sellerId: LOOSE_ID,
      productId: LOOSE_PRODUCT,
      variant: { id: LOOSE_VARIANT, sellingPricePaise: 7500 },
    });
    expect(price.variant?.sellingPricePaise).toBe(7500);

    const content = updateSellerProductSchema.parse({
      sellerId: LOOSE_ID,
      productId: LOOSE_PRODUCT,
      title: "Updated title for content edit",
    });
    expect(content.title).toContain("Updated");
  });

  it("admin seller review", () => {
    const parsed = reviewSellerSchema.parse({
      sellerId: LOOSE_ID,
      decision: "suspend",
      reason: "Policy review after re-audit",
      expectedVersion: 1,
    });
    expect(parsed.sellerId).toBe(LOOSE_ID);
  });

  it("fulfilment ship", () => {
    const parsed = shipGroupSchema.parse({
      fulfilmentGroupId: LOOSE_GROUP,
      carrier: "Mock Logistics",
    });
    expect(parsed.fulfilmentGroupId).toBe(LOOSE_GROUP);
  });
});
