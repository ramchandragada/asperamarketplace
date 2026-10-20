import { describe, expect, it } from "vitest";
import { checkPincodeServiceability } from "@/modules/fulfilment/pincode";

describe("checkPincodeServiceability", () => {
  it("rejects short pins", () => {
    const result = checkPincodeServiceability("5600");
    expect(result.serviceable).toBe(false);
  });

  it("rejects blocked prefixes", () => {
    const result = checkPincodeServiceability("001001");
    expect(result.serviceable).toBe(false);
  });

  it("autofills known metro pins", () => {
    const result = checkPincodeServiceability("560001");
    expect(result.serviceable).toBe(true);
    expect(result.city).toBe("Bengaluru");
    expect(result.state).toBe("Karnataka");
    expect(result.etaLabel).toBeTruthy();
  });

  it("treats other valid pins as serviceable", () => {
    const result = checkPincodeServiceability("641001");
    expect(result.serviceable).toBe(true);
    expect(result.codAvailable).toBe(true);
  });
});
