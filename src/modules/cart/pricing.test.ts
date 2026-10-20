import { describe, expect, it } from "vitest";
import {
  availableQuantity,
  buildCheckoutSnapshot,
  computeCoupon,
  computeShipping,
  computeTax,
  CouponRejectedError,
  TAX_POLICY,
} from "@/modules/cart/pricing";

describe("cart pricing helpers", () => {
  it("computes available quantity without trusting browser stock", () => {
    expect(availableQuantity(10, 3)).toBe(7);
    expect(availableQuantity(2, 5)).toBe(0);
  });

  it("builds a multi-seller snapshot with GST shipping and coupon traces", () => {
    const snapshot = buildCheckoutSnapshot({
      lines: [
        {
          variantId: "11111111-1111-1111-1111-111111111111",
          productId: "22222222-2222-2222-2222-222222222222",
          sellerId: "33333333-3333-3333-3333-333333333333",
          sellerName: "Seller A",
          productTitle: "Towel",
          variantTitle: "Pack",
          sku: "T-1",
          quantity: 2,
          unitPricePaise: 39900,
          availableQty: 40,
        },
        {
          variantId: "44444444-4444-4444-4444-444444444444",
          productId: "55555555-5555-5555-5555-555555555555",
          sellerId: "66666666-6666-6666-6666-666666666666",
          sellerName: "Seller B",
          productTitle: "Bottle",
          variantTitle: "750ml",
          sku: "B-1",
          quantity: 1,
          unitPricePaise: 69900,
          availableQty: 12,
        },
      ],
      couponCode: "ASPERA10",
      destinationState: "Karnataka",
      sellerStates: {
        "33333333-3333-3333-3333-333333333333": "Karnataka",
        "66666666-6666-6666-6666-666666666666": "Maharashtra",
      },
      totalWeightGrams: 1200,
    });

    expect(snapshot.subtotalPaise).toBe(39900 * 2 + 69900);
    expect(snapshot.discountPaise).toBe(14970);
    expect(snapshot.groups).toHaveLength(2);
    expect(snapshot.tax.policyKey).toBe(TAX_POLICY.key);
    expect(snapshot.tax.cgstPaise + snapshot.tax.sgstPaise + snapshot.tax.igstPaise).toBe(
      snapshot.taxPaise,
    );
    expect(snapshot.tax.supplyType).toBe("mixed");
    expect(snapshot.totalPaise).toBe(
      snapshot.subtotalPaise -
        snapshot.discountPaise +
        snapshot.shippingPaise +
        snapshot.taxPaise,
    );
  });

  it("splits CGST/SGST for intra-state supply", () => {
    const tax = computeTax(10_000, TAX_POLICY, {
      originState: "Karnataka",
      destinationState: "Karnataka",
    });
    expect(tax.taxPaise).toBe(1800);
    expect(tax.cgstPaise + tax.sgstPaise).toBe(1800);
    expect(tax.igstPaise).toBe(0);
    expect(tax.supplyType).toBe("intra_state");
  });

  it("uses IGST for inter-state supply", () => {
    const tax = computeTax(10_000, TAX_POLICY, {
      originState: "Maharashtra",
      destinationState: "Karnataka",
    });
    expect(tax.igstPaise).toBe(1800);
    expect(tax.cgstPaise).toBe(0);
    expect(tax.supplyType).toBe("inter_state");
  });

  it("rejects unknown coupons", () => {
    expect(computeCoupon("NOPE", 10000).accepted).toBe(false);
    expect(() =>
      buildCheckoutSnapshot({
        lines: [
          {
            variantId: "11111111-1111-1111-1111-111111111111",
            productId: "22222222-2222-2222-2222-222222222222",
            sellerId: "33333333-3333-3333-3333-333333333333",
            sellerName: "Seller A",
            productTitle: "Towel",
            variantTitle: "Pack",
            sku: "T-1",
            quantity: 1,
            unitPricePaise: 10000,
            availableQty: 1,
          },
        ],
        couponCode: "NOPE",
        destinationState: "Karnataka",
        totalWeightGrams: 400,
      }),
    ).toThrow(CouponRejectedError);
  });

  it("applies free shipping above threshold", () => {
    const shipping = computeShipping({
      subtotalAfterDiscountPaise: 100000,
      weightGrams: 500,
      destinationState: "Karnataka",
    });
    expect(shipping.shippingPaise).toBe(0);
    expect(computeTax(10000).taxPaise).toBe(1800);
  });
});
