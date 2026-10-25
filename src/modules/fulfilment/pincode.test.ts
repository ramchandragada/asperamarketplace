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

  it("quotes Pune Express in minutes", () => {
    const result = checkPincodeServiceability("411001");
    expect(result.serviceable).toBe(true);
    expect(result.city).toBe("Pune");
    expect(result.express).toBe(true);
    expect(result.etaMinutes).toBeLessThanOrEqual(90);
    expect(result.etaLabel?.toLowerCase()).toContain("min");
    expect(result.message.toLowerCase()).toContain("express");
  });

  it("treats any 411xxx pin as Pune Express", () => {
    const result = checkPincodeServiceability("411099");
    expect(result.serviceable).toBe(true);
    expect(result.express).toBe(true);
    expect(result.city).toBe("Pune");
  });

  it("autofills known metro pins with same-day express windows", () => {
    const result = checkPincodeServiceability("560001");
    expect(result.serviceable).toBe(true);
    expect(result.city).toBe("Bengaluru");
    expect(result.state).toBe("Karnataka");
    expect(result.etaLabel).toBeTruthy();
    expect(result.express).toBe(true);
  });

  it("treats other valid pins as serviceable without inventing a precise ETA", () => {
    const result = checkPincodeServiceability("641001");
    expect(result.serviceable).toBe(true);
    expect(result.express).toBe(false);
    expect(result.etaMinutes).toBeNull();
    expect(result.etaLabel?.toLowerCase()).toContain("usually");
    expect(result.codAvailable).toBe(false);
  });

  it("does not advertise COD on known metro pins (COD deferred)", () => {
    const result = checkPincodeServiceability("560001");
    expect(result.serviceable).toBe(true);
    expect(result.codAvailable).toBe(false);
    expect(result.message.toLowerCase()).not.toContain("cash on delivery");
  });
});
