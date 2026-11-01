import { describe, expect, it } from "vitest";
import { isOperatorPanelPath } from "@/components/shopper-chrome-gate";

describe("isOperatorPanelPath", () => {
  it("matches seller and admin consoles", () => {
    expect(isOperatorPanelPath("/seller")).toBe(true);
    expect(isOperatorPanelPath("/seller/onboarding")).toBe(true);
    expect(isOperatorPanelPath("/admin")).toBe(true);
    expect(isOperatorPanelPath("/admin/orders")).toBe(true);
  });

  it("leaves shopper routes alone", () => {
    expect(isOperatorPanelPath("/")).toBe(false);
    expect(isOperatorPanelPath("/sell")).toBe(false);
    expect(isOperatorPanelPath("/login")).toBe(false);
    expect(isOperatorPanelPath("/seller-policies")).toBe(false);
  });
});
