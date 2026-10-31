/**
 * Aspera storefront differentiators — single source for promo, trust strip,
 * PDP cluster, and Why Aspera page copy. Keep claims ops-backed.
 */

export const ASPERA_PROMO = {
  mobile: "Express under 90 mins* · Authorised dealers · Genuine parts",
  desktop:
    "Aspera Express — PC parts usually under 90 mins in hub zones* · Authorised brand dealers · Genuine products",
  finePrint:
    "*Pin-specific ETA is shown before you buy (often 30–90 minutes in Express hub zones, depending on stock).",
} as const;

export type AsperaPromiseId =
  | "express"
  | "genuine"
  | "warranty"
  | "tech"
  | "gst"
  | "price";

export type AsperaPromise = {
  id: AsperaPromiseId;
  /** Short strip label */
  label: string;
  /** One-line PDP / strip hint */
  hint: string;
  /** Longer Why Aspera body */
  body: string;
  href: string;
};

/** Home / global trust strip — five promises (price stays proof-led on Why page). */
export const ASPERA_TRUST_STRIP: AsperaPromise[] = [
  {
    id: "express",
    label: "Express under 90 mins*",
    hint: "Hub delivery by pin and stock",
    body: "In-stock PC parts from nearby hubs. Typical windows are under 90 minutes depending on your pincode and live stock — the header location bar and product page show your pin-specific quote before you buy.",
    href: "/shipping",
  },
  {
    id: "genuine",
    label: "Authorised dealers",
    hint: "100% genuine brand stock",
    body: "Products are sold by authorised brand dealers on Aspera — not grey-market imports. Approved sellers carry catalogue that maps to genuine brand channels.",
    href: "/why-aspera#genuine",
  },
  {
    id: "warranty",
    label: "Warranty pickup",
    hint: "Free pickup to service centre and back",
    body: "If a product has issues under warranty, Aspera arranges free pickup from your location to the brand service centre and return delivery back to you — you do not need to courier RMA yourself.",
    href: "/why-aspera#warranty",
  },
  {
    id: "tech",
    label: "Free tech support",
    hint: "Build and setup help",
    body: "Free technical support for builds, compatibility, and product setup — so you are not left alone after checkout.",
    href: "/why-aspera#tech",
  },
  {
    id: "gst",
    label: "GST input invoice",
    hint: "Business-ready tax invoice",
    body: "GST tax invoices with input credit for registered businesses. Add your GSTIN in business settings before checkout.",
    href: "/account/business",
  },
] as const;

/** PDP decision cluster — three lines beside purchase. */
export const ASPERA_PDP_PROMISES: AsperaPromise[] = [
  ASPERA_TRUST_STRIP[1]!, // genuine
  ASPERA_TRUST_STRIP[2]!, // warranty
  ASPERA_TRUST_STRIP[3]!, // tech
];

export const ASPERA_PRICE_PROMISE: AsperaPromise = {
  id: "price",
  label: "Hub dealer pricing",
  hint: "Competitive local dealer rates online",
  body: "Aspera surfaces hub dealer pricing online. We do not lead with empty “lowest price” slogans — compare live offers and authorised stock before you buy.",
  href: "/why-aspera#price",
};
