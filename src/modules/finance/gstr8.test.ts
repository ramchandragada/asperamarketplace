import { describe, expect, it } from "vitest";
import { gstr8ToCsv, type Gstr8Export } from "@/modules/finance/gstr8";
import { asperaLegal } from "@/platform/config/aspera-legal";

describe("gstr8ToCsv", () => {
  it("emits ECO TCS GSTIN and seller break-up columns", () => {
    const report: Gstr8Export = {
      periodMonth: "2026-11",
      tcsGstin: asperaLegal.gstinTcs,
      ecoLegalName: asperaLegal.legalEntity,
      rows: [
        {
          sellerGstin: "27AABCU9603R1ZM",
          sellerId: "s1",
          suppliesPaise: 1_000_000,
          returnsPaise: 0,
          netTaxablePaise: 1_000_000,
          cgstPaise: 5_000,
          sgstPaise: 5_000,
          igstPaise: 0,
          tcsPaise: 10_000,
        },
      ],
      totals: {
        suppliesPaise: 1_000_000,
        returnsPaise: 0,
        netTaxablePaise: 1_000_000,
        tcsPaise: 10_000,
      },
    };

    const csv = gstr8ToCsv(report);
    expect(csv).toContain("eco_gstin_tcs");
    expect(csv).toContain(asperaLegal.gstinTcs);
    expect(csv).toContain("27AABCU9603R1ZM");
    expect(csv).toContain("10000");
  });
});
