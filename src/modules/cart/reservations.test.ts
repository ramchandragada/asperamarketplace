import { describe, expect, it } from "vitest";
import { reservationLinesFromSnapshot } from "./reservations";

describe("reservation snapshot parsing", () => {
  it("keeps positive integer lines and drops malformed ones", () => {
    expect(
      reservationLinesFromSnapshot({
        lines: [
          { variantId: "v1", quantity: 2 },
          { variantId: "v2", quantity: 0 },
          { variantId: "", quantity: 1 },
          { quantity: 3 },
          { variantId: "v3", quantity: 1.5 },
        ],
      }),
    ).toEqual([{ variantId: "v1", quantity: 2 }]);
  });

  it("returns an empty list for missing snapshots", () => {
    expect(reservationLinesFromSnapshot(null)).toEqual([]);
    expect(reservationLinesFromSnapshot({})).toEqual([]);
  });
});
