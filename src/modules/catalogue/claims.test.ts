import { describe, expect, it } from "vitest";
import {
  containsForbiddenClaim,
  freeDeliveryHintFromPolicy,
  resolveStorefrontRating,
  sellerStorefrontLabel,
  sellerStorefrontLabelText,
} from "@/modules/catalogue/claims";

describe("catalogue claims truthfulness", () => {
  it("labels only approved sellers honestly", () => {
    expect(sellerStorefrontLabel({ sellerStatus: "approved" })).toBe(
      "approved_seller",
    );
    expect(sellerStorefrontLabel({ sellerStatus: "draft" })).toBeNull();
    expect(sellerStorefrontLabelText("approved_seller")).toBe("Approved seller");
  });

  it("ignores attribute demo ratings and requires real review aggregates", () => {
    expect(
      resolveStorefrontRating({
        attributeRatingAverage: 4.7,
        attributeReviewCount: 2200,
      }),
    ).toBeNull();

    expect(
      resolveStorefrontRating({
        reviewAggregateAverage: 4.5,
        reviewAggregateCount: 3,
        attributeRatingAverage: 4.9,
        attributeReviewCount: 9999,
      }),
    ).toEqual({ average: 4.5, count: 3 });
  });

  it("aligns free-delivery hint with shipping policy threshold", () => {
    expect(
      freeDeliveryHintFromPolicy({
        minPricePaise: 99800,
        freeAbovePaise: 99900,
      }),
    ).toBe(false);
    expect(
      freeDeliveryHintFromPolicy({
        minPricePaise: 99900,
        freeAbovePaise: 99900,
      }),
    ).toBe(true);
  });

  it("detects forbidden claim strings", () => {
    expect(containsForbiddenClaim("Trusted by Millions of shoppers")).toBe(
      true,
    );
    expect(containsForbiddenClaim("Clear pricing from independent sellers")).toBe(
      false,
    );
  });
});
