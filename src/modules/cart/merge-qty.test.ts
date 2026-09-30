import { describe, expect, it } from "vitest";
import { clampMergedQuantity } from "./merge-qty";

describe("clampMergedQuantity", () => {
  it("does not merge above available stock", () => {
    expect(clampMergedQuantity(2, 5, 3)).toBe(3);
    expect(clampMergedQuantity(0, 4, 4)).toBe(4);
    expect(clampMergedQuantity(3, 1, 0)).toBe(0);
  });
});
