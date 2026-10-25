import { afterEach, describe, expect, it, vi } from "vitest";
import * as paymentProvider from "@/modules/payments/provider";
import { POST } from "./route";

describe("mock-complete payment guard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("is disabled (404) when a non-mock payment provider is active", async () => {
    vi.spyOn(paymentProvider, "paymentsAreMockOnly").mockReturnValue(false);
    const response = await POST(
      new Request("http://localhost/api/payments/mock-complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ outcome: "succeeded" }),
      }),
    );
    expect(response.status).toBe(404);
  });

  it("does not 404 solely because NODE_ENV is production while mock payments are on", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(paymentProvider, "paymentsAreMockOnly").mockReturnValue(true);
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
    // Passes the provider gate; fails later on auth/validation — not a hard 404.
    expect(response.status).not.toBe(404);
  });
});
