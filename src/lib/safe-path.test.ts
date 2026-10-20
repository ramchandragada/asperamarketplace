import { describe, expect, it } from "vitest";
import { safeInternalPath } from "./safe-path";

describe("safeInternalPath", () => {
  it("accepts in-app paths", () => {
    expect(safeInternalPath("/checkout")).toBe("/checkout");
    expect(safeInternalPath("/cart?from=pdp")).toBe("/cart?from=pdp");
  });

  it("rejects open redirects", () => {
    expect(safeInternalPath("https://evil.example")).toBeNull();
    expect(safeInternalPath("//evil.example")).toBeNull();
    expect(safeInternalPath("/\\evil.example")).toBeNull();
    expect(safeInternalPath("/%2F%2Fevil.example")).toBeNull();
    expect(safeInternalPath(null)).toBeNull();
  });
});
