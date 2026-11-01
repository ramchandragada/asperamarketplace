import { describe, expect, it } from "vitest";
import { checkPincodeServiceability } from "@/modules/fulfilment/pincode";

describe("checkPincodeServiceability", () => {
  it("rejects short pins", () => {
    const result = checkPincodeServiceability("5600");
    expect(result.serviceable).toBe(false);
  });

  it("quotes Pune Express in minutes", () => {
    const result = checkPincodeServiceability("411001");
    expect(result.serviceable).toBe(true);
    expect(result.city).toBe("Pune");
    expect(result.express).toBe(true);
    expect(result.etaMinutes).toBeLessThanOrEqual(90);
    expect(result.etaLabel?.toLowerCase()).toContain("min");
    expect(result.message.toLowerCase()).toContain("express");
    expect(result.codAvailable).toBe(true);
  });

  it("treats any 411xxx pin as Pune Express", () => {
    const result = checkPincodeServiceability("411099");
    expect(result.serviceable).toBe(true);
    expect(result.express).toBe(true);
    expect(result.city).toBe("Pune");
  });

  it("does not invent Bengaluru / other metro Express hubs", () => {
    const result = checkPincodeServiceability("560001");
    expect(result.serviceable).toBe(false);
    expect(result.express).toBe(false);
    expect(result.message.toLowerCase()).toContain("pune");
  });

  it("rejects other valid Indian pins outside configured area", () => {
    const result = checkPincodeServiceability("641001");
    expect(result.serviceable).toBe(false);
    expect(result.express).toBe(false);
    expect(result.etaMinutes).toBeNull();
    expect(result.codAvailable).toBe(false);
  });
});
