import { describe, expect, it } from "vitest";
import { commissionPaise } from "./helpers";

describe("finance helpers", () => {
  it("computes commission in paise from basis points", () => {
    expect(commissionPaise(10_000, 1000)).toBe(1000);
    expect(commissionPaise(19900, 1000)).toBe(1990);
    expect(commissionPaise(1, 1000)).toBe(0);
  });
});
