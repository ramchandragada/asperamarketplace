import { describe, expect, it } from "vitest";
import { DEV_MOCK_WEBHOOK_SECRET, resolveMockWebhookSecret } from "./provider";

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
