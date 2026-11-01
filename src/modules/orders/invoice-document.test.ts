import { describe, expect, it } from "vitest";
import {
  buildEcoInvoiceDocument,
  renderInvoiceHtml,
} from "@/modules/orders/invoice-document";
import { asperaLegal } from "@/platform/config/aspera-legal";

describe("buildEcoInvoiceDocument", () => {
  it("lists seller as supplier and Aspera as ECO with s.52 TCS", () => {
    const doc = buildEcoInvoiceDocument({
      invoiceNumber: "INV-TEST-1",
      orderNumber: "ORD-TEST-1",
      orderId: "00000000-0000-4000-8000-000000000001",
      buyer: {
        userId: "u1",
        email: "buyer@example.com",
        name: "Buyer",
      },
      shipTo: {
        fullName: "Buyer",
        line1: "FC Road",
        line2: null,
        city: "Pune",
        state: "Maharashtra",
        postalCode: "411004",
        country: "IN",
      },
      sellers: [
        {
          sellerId: "s1",
          legalName: "Pune City Computers Private Limited",
          tradeName: "Pune City Computers",
          gstin: "27AABCU9603R1ZM",
          registeredState: "Maharashtra",
          pickupCity: "Pune",
          fulfilmentBy: "seller_shop",
          taxablePaise: 1_000_000,
          lines: [
            {
              sku: "SKU-1",
              title: "CPU",
              quantity: 1,
              unitPricePaise: 1_000_000,
              lineTotalPaise: 1_000_000,
            },
          ],
        },
      ],
      totals: {
        subtotalPaise: 1_000_000,
        discountPaise: 0,
        shippingPaise: 0,
        taxPaise: 0,
        totalPaise: 1_000_000,
      },
    });

    expect(doc.eco.role).toBe("electronic_commerce_operator");
    expect(doc.eco.gstinTcs).toBe(asperaLegal.gstinTcs);
    expect(doc.sellers[0]?.gstin).toBe("27AABCU9603R1ZM");
    expect(doc.sellers[0]?.fulfilment.by).toBe("seller");
    expect(doc.sellers[0]?.tcs.tcsPaise).toBe(10_000);
    expect(doc.totals.tcsWithheldPaise).toBe(10_000);
    expect(doc.totals.totalPaise).toBe(1_000_000);

    const html = renderInvoiceHtml(doc);
    expect(html).toContain("Supplier (seller)");
    expect(html).toContain("Marketplace / ECO");
    expect(html).toContain(asperaLegal.gstinTcs);
    expect(html).toContain("27AABCU9603R1ZM");
    expect(html).toContain("does not increase the buyer price");
  });
});
