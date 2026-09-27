import { describe, expect, it } from "vitest";
import { openRiskCaseSchema, createReviewSchema } from "./schema";

describe("trust schemas", () => {
  it("accepts a valid risk case payload", () => {
    const parsed = openRiskCaseSchema.parse({
      subjectType: "seller",
      subjectId: "abc",
      severity: "high",
      title: "Suspicious payout pattern",
      details: "Multiple refund spikes within 24 hours on mock data.",
    });
    expect(parsed.severity).toBe("high");
  });

  it("requires rating 1-5 for reviews", () => {
    expect(() =>
      createReviewSchema.parse({
        productId: "00000000-0000-4000-8000-000000000001",
        rating: 6,
        title: "Great",
        body: "Would buy again for sure.",
      }),
    ).toThrow();
  });
});
