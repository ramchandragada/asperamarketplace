import { describe, expect, it } from "vitest";
import {
  allocatedGstPaise,
  cappedMerchandisePaise,
  refundBreakdown,
  unitMerchandisePaise,
} from "./refund-math";

describe("allocatedGstPaise", () => {
  it("allocates GST in proportion to the line's share of the subtotal", () => {
    // Line is half the order subtotal, so it carries half the GST.
    expect(
      allocatedGstPaise({
        merchandisePaise: 50000,
        orderSubtotalPaise: 100000,
        orderTaxPaise: 18000,
      }),
    ).toBe(9000);
  });

  it("is zero when there is no tax or no subtotal", () => {
    expect(
      allocatedGstPaise({ merchandisePaise: 50000, orderSubtotalPaise: 0, orderTaxPaise: 18000 }),
    ).toBe(0);
    expect(
      allocatedGstPaise({ merchandisePaise: 50000, orderSubtotalPaise: 100000, orderTaxPaise: 0 }),
    ).toBe(0);
  });
});

describe("refundBreakdown", () => {
  it("returns item + GST and stays balanced (sellerDebit + commission + gst === total)", () => {
    const b = refundBreakdown({
      merchandisePaise: 100000,
      orderSubtotalPaise: 100000,
      orderTaxPaise: 18000,
      commissionRateBps: 1000, // 10%
    });
    expect(b.merchandisePaise).toBe(100000);
    expect(b.gstPaise).toBe(18000);
    expect(b.totalPaise).toBe(118000); // item + GST, shipping excluded
    expect(b.commissionPaise).toBe(10000);
    expect(b.sellerDebitPaise).toBe(90000);
    // Ledger invariant: the debits must sum to the cash credited to the buyer.
    expect(b.sellerDebitPaise + b.commissionPaise + b.gstPaise).toBe(b.totalPaise);
  });

  it("is all zero for a zero merchandise refund", () => {
    const b = refundBreakdown({
      merchandisePaise: 0,
      orderSubtotalPaise: 100000,
      orderTaxPaise: 18000,
      commissionRateBps: 1000,
    });
    expect(b.totalPaise).toBe(0);
    expect(b.sellerDebitPaise).toBe(0);
  });
});

describe("cappedMerchandisePaise", () => {
  it("caps a refund to what the line still has refundable", () => {
    // Full line is 1000; 1000 already refunded by a prior return → nothing left.
    expect(
      cappedMerchandisePaise({
        desiredMerchandisePaise: 1000,
        lineMerchandisePaise: 1000,
        alreadyRefundedMerchandisePaise: 1000,
      }),
    ).toBe(0);
  });

  it("allows only the remaining portion when partially refunded", () => {
    expect(
      cappedMerchandisePaise({
        desiredMerchandisePaise: 1000,
        lineMerchandisePaise: 1000,
        alreadyRefundedMerchandisePaise: 600,
      }),
    ).toBe(400);
  });

  it("passes the full desired amount when nothing was refunded yet", () => {
    expect(
      cappedMerchandisePaise({
        desiredMerchandisePaise: 700,
        lineMerchandisePaise: 1000,
        alreadyRefundedMerchandisePaise: 0,
      }),
    ).toBe(700);
  });
});

describe("unitMerchandisePaise", () => {
  it("floors the per-unit merchandise price", () => {
    expect(unitMerchandisePaise(34900, 1)).toBe(34900);
    expect(unitMerchandisePaise(10001, 3)).toBe(3333);
    expect(unitMerchandisePaise(1000, 0)).toBe(0);
  });
});
