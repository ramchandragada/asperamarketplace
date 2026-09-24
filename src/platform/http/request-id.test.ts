import { describe, expect, it } from "vitest";
import { resolveRequestId } from "@/platform/http/request-id";

describe("resolveRequestId", () => {
  it("keeps a supplied uuid", () => {
    const id = "4f1c2a10-6b7d-4e8f-9a11-223344556677";
    expect(resolveRequestId(id)).toBe(id);
  });

  it("replaces a missing or malformed header", () => {
    expect(resolveRequestId(null)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(resolveRequestId("not-a-uuid")).not.toBe("not-a-uuid");
  });
});
