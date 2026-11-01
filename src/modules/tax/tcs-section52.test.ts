import { describe, expect, it } from "vitest";
import { computeTcsSection52 } from "@/modules/tax/tcs-section52";
import { asperaLegal } from "@/platform/config/aspera-legal";

describe("computeTcsSection52", () => {
  it("withholds 0.5%+0.5% intra-State without inflating buyer math", () => {
    // ₹10,000 taxable → ₹50 CGST + ₹50 SGST TCS
    const line = computeTcsSection52({
      taxablePaise: 1_000_000,
      originState: "Maharashtra",
      destinationState: "Maharashtra",
    });
    expect(line.supplyType).toBe("intra_state");
    expect(line.cgstPaise).toBe(5_000);
    expect(line.sgstPaise).toBe(5_000);
    expect(line.igstPaise).toBe(0);
    expect(line.tcsPaise).toBe(10_000);
    expect(line.tcsGstin).toBe(asperaLegal.gstinTcs);
  });

  it("withholds 1% IGST for inter-State", () => {
    const line = computeTcsSection52({
      taxablePaise: 1_000_000,
      originState: "Maharashtra",
      destinationState: "Karnataka",
    });
    expect(line.supplyType).toBe("inter_state");
    expect(line.igstPaise).toBe(10_000);
    expect(line.cgstPaise).toBe(0);
    expect(line.sgstPaise).toBe(0);
    expect(line.tcsPaise).toBe(10_000);
  });

  it("returns zero TCS on non-positive taxable value", () => {
    const line = computeTcsSection52({
      taxablePaise: 0,
      originState: "Maharashtra",
      destinationState: "Maharashtra",
    });
    expect(line.tcsPaise).toBe(0);
  });
});
