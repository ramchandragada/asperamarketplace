import { describe, expect, it } from "vitest";
import { lookupGstinProfile, parseGstin, stateNameForCode } from "./gstin";

describe("parseGstin", () => {
  it("extracts Maharashtra + PAN from a Regular GSTIN", () => {
    expect(parseGstin("27AAECV2453M1ZZ")).toEqual({
      gstin: "27AAECV2453M1ZZ",
      stateCode: "27",
      registeredState: "Maharashtra",
      pan: "AAECV2453M",
    });
  });

  it("normalizes whitespace and casing", () => {
    expect(parseGstin(" 29abcde1234f1z5 ")?.pan).toBe("ABCDE1234F");
    expect(parseGstin(" 29abcde1234f1z5 ")?.registeredState).toBe("Karnataka");
  });

  it("rejects malformed GSTINs", () => {
    expect(parseGstin("27AAECV2453M")).toBeNull();
    expect(parseGstin("AAECV2453M")).toBeNull();
    expect(parseGstin("")).toBeNull();
  });
});

describe("stateNameForCode", () => {
  it("maps common GST state codes", () => {
    expect(stateNameForCode("27")).toBe("Maharashtra");
    expect(stateNameForCode("07")).toBe("Delhi");
    expect(stateNameForCode("99")).toBeNull();
  });
});

describe("lookupGstinProfile", () => {
  it("always returns state and PAN without a remote provider", async () => {
    const profile = await lookupGstinProfile("27AAECV2453M1ZZ", {
      GSTIN_LOOKUP_DISABLE_REMOTE: "true",
    });
    expect(profile).toMatchObject({
      gstin: "27AAECV2453M1ZZ",
      pan: "AAECV2453M",
      registeredState: "Maharashtra",
      legalName: null,
      source: "gstin",
    });
  });
});
