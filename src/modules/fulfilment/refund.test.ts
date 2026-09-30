import { describe, expect, it } from "vitest";
import { cappedReturnQuantity, returnRefundPaise } from "./refund";

describe("return refund caps", () => {
  it("caps a 99-unit request on a 1-unit line to the amount paid", () => {
    expect(
      returnRefundPaise({
        lineTotalPaise: 34900,
        purchasedQuantity: 1,
        requestedQuantity: 99,
      }),
    ).toBe(34900);
    expect(cappedReturnQuantity(1, 99)).toBe(1);
  });

  it("subtracts quantities already requested for the same line", () => {
    expect(cappedReturnQuantity(4, 3, 2)).toBe(2);
    expect(
      returnRefundPaise({
        lineTotalPaise: 40000,
        purchasedQuantity: 4,
        requestedQuantity: 3,
        alreadyReturnedQuantity: 2,
      }),
    ).toBe(20000);
  });

  it("returns nothing when the line is already fully returned", () => {
    expect(cappedReturnQuantity(2, 1, 2)).toBe(0);
    expect(
      returnRefundPaise({
        lineTotalPaise: 20000,
        purchasedQuantity: 2,
        requestedQuantity: 1,
        alreadyReturnedQuantity: 2,
      }),
    ).toBe(0);
  });
});
