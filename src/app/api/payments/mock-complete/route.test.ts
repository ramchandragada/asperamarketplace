import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("mock-complete payment guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is disabled (404) in production so orders cannot be self-marked paid", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await POST(
      new Request("http://localhost/api/payments/mock-complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ outcome: "succeeded" }),
      }),
    );
    expect(response.status).toBe(404);
  });
});
