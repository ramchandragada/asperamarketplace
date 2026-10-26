import { describe, expect, it } from "vitest";
import {
  DEV_MOCK_WEBHOOK_SECRET,
  mockSelfPayAllowed,
  paymentsAreMockOnly,
  resolveMockWebhookSecret,
} from "./provider";

describe("paymentsAreMockOnly", () => {
  it("is true while the mock provider is the active gateway", () => {
    expect(paymentsAreMockOnly({ PAYMENT_PROVIDER: "mock" })).toBe(true);
    expect(paymentsAreMockOnly({})).toBe(true);
  });

  it("is false when PAYMENT_PROVIDER is an unknown real-provider name", () => {
    expect(paymentsAreMockOnly({ PAYMENT_PROVIDER: "razorpay" })).toBe(false);
  });
});

describe("mockSelfPayAllowed", () => {
  it("allows mock self-pay outside production", () => {
    expect(
      mockSelfPayAllowed({
        NODE_ENV: "test",
        PAYMENT_PROVIDER: "mock",
      }),
    ).toBe(true);
  });

  it("never allows mock self-pay on Vercel production, even with the allow flag", () => {
    expect(
      mockSelfPayAllowed({
        NODE_ENV: "production",
        VERCEL_ENV: "production",
        PAYMENT_PROVIDER: "mock",
      }),
    ).toBe(false);
    expect(
      mockSelfPayAllowed({
        NODE_ENV: "production",
        VERCEL_ENV: "production",
        PAYMENT_PROVIDER: "mock",
        ALLOW_MOCK_SELF_PAY: "true",
      }),
    ).toBe(false);
  });

  it("allows NODE_ENV=production only when not on Vercel production and flag is set", () => {
    expect(
      mockSelfPayAllowed({
        NODE_ENV: "production",
        VERCEL_ENV: "preview",
        PAYMENT_PROVIDER: "mock",
        ALLOW_MOCK_SELF_PAY: "true",
      }),
    ).toBe(true);
    expect(
      mockSelfPayAllowed({
        NODE_ENV: "production",
        VERCEL_ENV: "preview",
        PAYMENT_PROVIDER: "mock",
      }),
    ).toBe(false);
  });

  it("stays closed when the provider is no longer mock even with the allow flag", () => {
    expect(
      mockSelfPayAllowed({
        NODE_ENV: "production",
        ALLOW_MOCK_SELF_PAY: "true",
        PAYMENT_PROVIDER: "razorpay",
      }),
    ).toBe(false);
  });
});

describe("mock webhook secret", () => {
  it("rejects the public default in production", () => {
    expect(
      resolveMockWebhookSecret({
        NODE_ENV: "production",
        MOCK_PAYMENT_WEBHOOK_SECRET: DEV_MOCK_WEBHOOK_SECRET,
      }),
    ).toBeNull();
    expect(resolveMockWebhookSecret({ NODE_ENV: "production" })).toBeNull();
  });

  it("accepts a distinct production secret and keeps a dev fallback", () => {
    expect(
      resolveMockWebhookSecret({
        NODE_ENV: "production",
        MOCK_PAYMENT_WEBHOOK_SECRET: "prod-only-secret",
      }),
    ).toBe("prod-only-secret");
    expect(resolveMockWebhookSecret({ NODE_ENV: "test" })).toBe(
      DEV_MOCK_WEBHOOK_SECRET,
    );
  });
});
