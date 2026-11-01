import { describe, expect, it } from "vitest";
import { isSellerOnboardingPath } from "@/modules/seller/access";

describe("isSellerOnboardingPath", () => {
  it("matches the KYC apply route", () => {
    expect(isSellerOnboardingPath("/seller/onboarding")).toBe(true);
    expect(isSellerOnboardingPath("/seller/onboarding/")).toBe(true);
  });

  it("does not match other seller console routes", () => {
    expect(isSellerOnboardingPath("/seller")).toBe(false);
    expect(isSellerOnboardingPath("/seller/catalogue")).toBe(false);
    expect(isSellerOnboardingPath("/sell")).toBe(false);
    expect(isSellerOnboardingPath("/seller/onboarding-extra")).toBe(false);
  });
});
