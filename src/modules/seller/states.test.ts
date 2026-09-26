import { describe, expect, it } from "vitest";
import { canTransitionSellerStatus } from "@/modules/seller/states";

describe("seller status transitions", () => {
  it("allows draft to submitted", () => {
    expect(canTransitionSellerStatus("draft", "submitted")).toBe(true);
  });

  it("rejects draft to approved", () => {
    expect(canTransitionSellerStatus("draft", "approved")).toBe(false);
  });

  it("allows under_review to approved or rejected", () => {
    expect(canTransitionSellerStatus("under_review", "approved")).toBe(true);
    expect(canTransitionSellerStatus("under_review", "rejected")).toBe(true);
  });
});
