/**
 * Marketplace invoice / tax trail document.
 * Goods supplier = seller (Regular GSTIN). Aspera = ECO (TCS GSTIN).
 * TCS is shown as withheld from seller proceeds — not added to buyer total.
 */
import { asperaLegal } from "@/platform/config/aspera-legal";
import { computeTcsSection52 } from "@/modules/tax/tcs-section52";

export type InvoiceSellerSlice = {
  sellerId: string;
  legalName: string;
  tradeName: string | null;
  gstin: string | null;
  registeredState: string | null;
  pickupCity: string | null;
  fulfilmentBy: string;
  lines: Array<{
    sku: string;
    title: string;
    quantity: number;
    unitPricePaise: number;
    lineTotalPaise: number;
    hsnCode?: string | null;
  }>;
  taxablePaise: number;
};

export type EcoInvoiceDocument = {
  invoiceNumber: string;
  orderNumber: string;
  orderId: string;
  issuedAt: string;
  buyer: {
    userId: string;
    email: string;
    name: string;
    gstin?: string | null;
  };
  shipTo: {
    fullName: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  sellers: Array<{
    legalName: string;
    tradeName: string | null;
    gstin: string | null;
    registeredState: string | null;
    fulfilment:
      | { by: "seller"; label: string }
      | { by: "aspera_warehouse"; label: string };
    lines: InvoiceSellerSlice["lines"];
    taxablePaise: number;
    tcs: {
      supplyType: string;
      cgstPaise: number;
      sgstPaise: number;
      igstPaise: number;
      tcsPaise: number;
      note: string;
    };
  }>;
  eco: {
    legalName: string;
    cin: string;
    pan: string;
    gstinRegular: string;
    gstinTcs: string;
    role: "electronic_commerce_operator";
    address: string;
  };
  totals: {
    subtotalPaise: number;
    discountPaise: number;
    shippingPaise: number;
    taxPaise: number;
    totalPaise: number;
    tcsWithheldPaise: number;
  };
  /** prepaid | cod — presentation only; TCS still withheld from seller. */
  collectionMode: "prepaid" | "cod";
  disclaimer: string;
};

export function buildEcoInvoiceDocument(input: {
  invoiceNumber: string;
  orderNumber: string;
  orderId: string;
  buyer: EcoInvoiceDocument["buyer"];
  shipTo: EcoInvoiceDocument["shipTo"];
  sellers: InvoiceSellerSlice[];
  totals: {
    subtotalPaise: number;
    discountPaise: number;
    shippingPaise: number;
    taxPaise: number;
    totalPaise: number;
  };
  collectionMode?: "prepaid" | "cod";
}): EcoInvoiceDocument {
  const collectionMode = input.collectionMode ?? "prepaid";
  const destinationState = input.shipTo.state;
  let tcsWithheldPaise = 0;

  const sellers = input.sellers.map((slice) => {
    const originState = slice.registeredState ?? "Maharashtra";
    const tcs = computeTcsSection52({
      taxablePaise: slice.taxablePaise,
      originState,
      destinationState,
    });
    tcsWithheldPaise += tcs.tcsPaise;
    const fulfilment =
      slice.fulfilmentBy === "aspera_warehouse"
        ? {
            by: "aspera_warehouse" as const,
            label: "Fulfilled by Aspera warehouse",
          }
        : {
            by: "seller" as const,
            label: `Fulfilled by seller${
              slice.pickupCity ? ` from ${slice.pickupCity}` : ""
            }`,
          };

    return {
      legalName: slice.legalName,
      tradeName: slice.tradeName,
      gstin: slice.gstin,
      registeredState: slice.registeredState,
      fulfilment,
      lines: slice.lines,
      taxablePaise: slice.taxablePaise,
      tcs: {
        supplyType: tcs.supplyType,
        cgstPaise: tcs.cgstPaise,
        sgstPaise: tcs.sgstPaise,
        igstPaise: tcs.igstPaise,
        tcsPaise: tcs.tcsPaise,
        note: "TCS under CGST Act s.52 is deducted from seller settlement; it does not increase the buyer price.",
      },
    };
  });

  return {
    invoiceNumber: input.invoiceNumber,
    orderNumber: input.orderNumber,
    orderId: input.orderId,
    issuedAt: new Date().toISOString(),
    buyer: input.buyer,
    shipTo: input.shipTo,
    sellers,
    eco: {
      legalName: asperaLegal.legalEntity,
      cin: asperaLegal.cin,
      pan: asperaLegal.pan,
      gstinRegular: asperaLegal.gstinRegular,
      gstinTcs: asperaLegal.gstinTcs,
      role: "electronic_commerce_operator",
      address: asperaLegal.tcsPpob.lines.join(", "),
    },
    totals: {
      ...input.totals,
      tcsWithheldPaise,
    },
    collectionMode,
    disclaimer:
      "Tax invoice for goods is issued by the selling dealer under their Regular GSTIN. " +
      `${asperaLegal.legalEntity} acts as electronic commerce operator and collects TCS under GSTIN ${asperaLegal.gstinTcs}.`,
  };
}

export function renderInvoiceHtml(doc: EcoInvoiceDocument): string {
  const inr = (paise: number) =>
    `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const sellerBlocks = doc.sellers
    .map((seller) => {
      const lines = seller.lines
        .map(
          (line) =>
            `<tr><td>${escapeHtml(line.title)}</td><td>${escapeHtml(line.sku)}</td><td>${line.quantity}</td><td>${inr(line.unitPricePaise)}</td><td>${inr(line.lineTotalPaise)}</td></tr>`,
        )
        .join("");
      return `
      <section>
        <h2>Supplier (seller)</h2>
        <p><strong>${escapeHtml(seller.legalName)}</strong>${
          seller.tradeName
            ? ` <span>(${escapeHtml(seller.tradeName)})</span>`
            : ""
        }</p>
        <p>GSTIN: ${escapeHtml(seller.gstin ?? "Not on file")}</p>
        <p>${escapeHtml(seller.fulfilment.label)}</p>
        <table>
          <thead><tr><th>Item</th><th>SKU</th><th>Qty</th><th>Unit</th><th>Line</th></tr></thead>
          <tbody>${lines}</tbody>
        </table>
        <p>Taxable (seller): ${inr(seller.taxablePaise)}</p>
        <p>TCS (${escapeHtml(seller.tcs.supplyType)}): CGST ${inr(
          seller.tcs.cgstPaise,
        )} · SGST ${inr(seller.tcs.sgstPaise)} · IGST ${inr(
          seller.tcs.igstPaise,
        )} · Total ${inr(seller.tcs.tcsPaise)}</p>
        <p class="muted">${escapeHtml(seller.tcs.note)}</p>
      </section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(doc.invoiceNumber)}</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #0b1220; margin: 2rem; }
    h1 { font-size: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin: 0.75rem 0 1.25rem; }
    th, td { border: 1px solid #e6eaf0; padding: 0.4rem 0.5rem; text-align: left; font-size: 0.875rem; }
    .muted { color: #5a6578; font-size: 0.8rem; }
    section { margin-bottom: 1.5rem; }
    @media print { body { margin: 0.5rem; } }
  </style>
</head>
<body>
  <h1>Invoice ${escapeHtml(doc.invoiceNumber)}</h1>
  <p>Order ${escapeHtml(doc.orderNumber)} · Issued ${escapeHtml(doc.issuedAt)}</p>
  <section>
    <h2>Marketplace / ECO</h2>
    <p><strong>${escapeHtml(doc.eco.legalName)}</strong></p>
    <p>CIN ${escapeHtml(doc.eco.cin)} · PAN ${escapeHtml(doc.eco.pan)}</p>
    <p>Regular GSTIN ${escapeHtml(doc.eco.gstinRegular)} · TCS GSTIN ${escapeHtml(
      doc.eco.gstinTcs,
    )}</p>
    <p>${escapeHtml(doc.eco.address)}</p>
  </section>
  <section>
    <h2>Buyer</h2>
    <p>${escapeHtml(doc.buyer.name)} · ${escapeHtml(doc.buyer.email)}</p>
    ${doc.buyer.gstin ? `<p>Buyer GSTIN ${escapeHtml(doc.buyer.gstin)}</p>` : ""}
    <p>${escapeHtml(doc.shipTo.fullName)}, ${escapeHtml(doc.shipTo.line1)}, ${escapeHtml(
      doc.shipTo.city,
    )}, ${escapeHtml(doc.shipTo.state)} ${escapeHtml(doc.shipTo.postalCode)}</p>
  </section>
  ${sellerBlocks}
  <section>
    <h2>Buyer totals (${doc.collectionMode === "cod" ? "COD" : "prepaid"})</h2>
    <p>Subtotal ${inr(doc.totals.subtotalPaise)} · Discount ${inr(
      doc.totals.discountPaise,
    )} · Shipping ${inr(doc.totals.shippingPaise)} · Tax ${inr(
      doc.totals.taxPaise,
    )}</p>
    <p><strong>${
      doc.collectionMode === "cod" ? "Collect on delivery" : "Total paid"
    } ${inr(doc.totals.totalPaise)}</strong></p>
    <p class="muted">TCS withheld from sellers (not added to buyer): ${inr(
      doc.totals.tcsWithheldPaise,
    )}</p>
  </section>
  <p class="muted">${escapeHtml(doc.disclaimer)}</p>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
