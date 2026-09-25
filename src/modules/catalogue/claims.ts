/**
 * Central merchandising claim / badge eligibility.
 * P0: never render programme badges without an evidence-backed source of truth.
 */

export const FORBIDDEN_CLAIM_STRINGS = [
  "Trusted by Millions",
  "Verified quality",
  "Original Brands",
  "Aspera Original",
  "Mall",
] as const;

export type TruthfulSellerLabel = "approved_seller" | null;

/**
 * Approved marketplace seller ≠ Featured Store / Verified Business programme.
 */
export function sellerStorefrontLabel(input: {
  sellerStatus?: string | null;
}): TruthfulSellerLabel {
  if (input.sellerStatus === "approved") return "approved_seller";
  return null;
}

export function sellerStorefrontLabelText(
  label: TruthfulSellerLabel,
): string | null {
  if (label === "approved_seller") return "Approved seller";
  return null;
}

export type StorefrontRating = {
  average: number;
  count: number;
};

/**
 * Only moderated ProductReview aggregates are eligible for public ratings.
 * Seeded Product.attributes metrics must never be treated as customer activity.
 */
export function resolveStorefrontRating(input: {
  reviewAggregateAverage?: number | null;
  reviewAggregateCount?: number | null;
  /** @deprecated Attribute demo metrics — ignored for storefront truth */
  attributeRatingAverage?: number | null;
  attributeReviewCount?: number | null;
}): StorefrontRating | null {
  void input.attributeRatingAverage;
  void input.attributeReviewCount;
  const count = input.reviewAggregateCount ?? 0;
  const average = input.reviewAggregateAverage;
  if (count <= 0 || average == null || Number.isNaN(average)) return null;
  if (average < 1 || average > 5) return null;
  return { average, count };
}

/** Free-delivery hint must follow checkout shipping policy threshold only. */
export function freeDeliveryHintFromPolicy(input: {
  minPricePaise: number;
  freeAbovePaise: number;
}): boolean {
  return input.minPricePaise >= input.freeAbovePaise;
}

export function containsForbiddenClaim(text: string): boolean {
  const lower = text.toLowerCase();
  return FORBIDDEN_CLAIM_STRINGS.some((claim) =>
    lower.includes(claim.toLowerCase()),
  );
}
