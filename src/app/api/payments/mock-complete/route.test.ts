import { afterEach, describe, expect, it, vi } from "vitest";
import * as paymentProvider from "@/modules/payments/provider";
import { POST } from "./route";

describe("mock-complete payment guard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("is disabled (404) when mock self-pay is not allowed", async () => {
    vi.spyOn(paymentProvider, "mockSelfPayAllowed").mockReturnValue(false);
    const response = await POST(
      new Request("http://localhost/api/payments/mock-complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ outcome: "succeeded" }),
      }),
    );
    expect(response.status).toBe(404);
  });

  it("404s in production without ALLOW_MOCK_SELF_PAY even if the provider is mock", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("PAYMENT_PROVIDER", "mock");
    vi.stubEnv("ALLOW_MOCK_SELF_PAY", "");
    const response = await POST(
      new Request("http://localhost/api/payments/mock-complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          paymentAttemptId: "00000000-0000-0000-0000-000000000000",
          outcome: "succeeded",
        }),
      }),
    );
    expect(response.status).toBe(404);
  });

  it("passes the env gate when mock self-pay is explicitly allowed", async () => {
    vi.spyOn(paymentProvider, "mockSelfPayAllowed").mockReturnValue(true);
    const response = await POST(
      new Request("http://localhost/api/payments/mock-complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          paymentAttemptId: "00000000-0000-0000-0000-000000000000",
          outcome: "succeeded",
        }),
      }),
    );
    // Passes the env/provider gate; fails later on auth/validation — not a hard 404.
    expect(response.status).not.toBe(404);
  });
});
