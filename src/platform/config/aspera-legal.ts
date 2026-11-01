/**
 * Canonical legal imprint for Aspera Express (aspera.market).
 * Source of truth for footer, invoices, seller agreement, grievance, metadata.
 * Do not invent alternate company names or GSTINs.
 */
export const asperaLegal = {
  brandName: "Aspera",
  marketplaceName: "Aspera Express",
  legalEntity: "Aspera Technologies Private Limited",
  cin: "U72900PN2022PTC211370",
  pan: "AAXCA0147N",
  /** Regular GSTIN (Maharashtra) — commission / own-account supplies. */
  gstinRegular: "27AAXCA0147N1Z4",
  /**
   * TCS / Tax Collector GSTIN (Maharashtra) — Electronic Commerce Operator
   * under CGST Act s.52. Effective 06/10/2026.
   */
  gstinTcs: "27AAXCA0147N1CF",
  gstinTcsEffectiveFrom: "2026-10-06",
  state: "Maharashtra",
  stateCode: "27",
  /** TCS principal place of business (Tax Collector registration). */
  tcsPpob: {
    lines: [
      "OFFICE NO. A/22/1 TO A/29/2, 2ND FLOOR, PANJWANI MARKET",
      "AKKALKOT ROAD, SOLAPUR",
      "MAHARASHTRA 413006",
    ],
    city: "Solapur",
    pincode: "413006",
  },
  /** Correspondence / HO published on theGSTco for Aspera Technologies. */
  correspondenceAddresses: [
    {
      label: "Pune head office",
      lines: [
        "Office No. 305, ICON IT Park",
        "Near Pune–Bangalore Highway, Narhe",
        "Pune, Maharashtra 411041",
      ],
    },
    {
      label: "Solapur (Aspera ITES Centre)",
      lines: [
        "Block B, Aspera ITES Centre, 2nd & 3rd Floor",
        "Panjwani Market, Solapur, Maharashtra 413006",
      ],
    },
  ],
  supportEmail:
    process.env.SITE_SUPPORT_EMAIL?.trim() || "support@asperamarketplace.com",
  supportPhoneDisplay:
    process.env.SITE_SUPPORT_PHONE?.trim() || "+91 80 4680 1200",
  supportPhoneTel:
    process.env.SITE_SUPPORT_PHONE_TEL?.trim() || "+918046801200",
  grievanceEmail:
    process.env.SITE_GRIEVANCE_EMAIL?.trim() ||
    "grievance@asperamarketplace.com",
  /**
   * Named grievance officer under Consumer Protection (E-commerce) Rules, 2020.
   * Production sets SITE_GRIEVANCE_OFFICER_NAME to the appointed person.
   */
  grievanceOfficer: {
    name:
      process.env.SITE_GRIEVANCE_OFFICER_NAME?.trim() || "Ramchandra Gada",
    designation:
      process.env.SITE_GRIEVANCE_OFFICER_TITLE?.trim() || "Grievance Officer",
    email:
      process.env.SITE_GRIEVANCE_EMAIL?.trim() ||
      "grievance@asperamarketplace.com",
    phoneDisplay:
      process.env.SITE_GRIEVANCE_PHONE?.trim() || "+91 80 4680 1200",
    phoneTel:
      process.env.SITE_GRIEVANCE_PHONE_TEL?.trim() || "+918046801200",
    postalAddress: [
      "Aspera Technologies Private Limited",
      "Office No. 305, ICON IT Park",
      "Near Pune–Bangalore Highway, Narhe",
      "Pune, Maharashtra 411041",
    ],
  },
  /** Live serviceable area until more pins / warehouses are configured. */
  serviceableAreaSummary:
    "Pune Express pins starting with 411 (Maharashtra), prepaid delivery only",
  governingLaw: "Laws of India; exclusive jurisdiction of courts at Pune, Maharashtra",
  website: "https://aspera.market",
} as const;

export type AsperaLegal = typeof asperaLegal;

export function formatAddressLines(lines: readonly string[]): string {
  return lines.join(", ");
}

export function imprintLines(): string[] {
  return [
    asperaLegal.legalEntity,
    `CIN ${asperaLegal.cin}`,
    `PAN ${asperaLegal.pan}`,
    `GSTIN (Regular) ${asperaLegal.gstinRegular}`,
    `GSTIN (TCS / ECO) ${asperaLegal.gstinTcs}`,
    formatAddressLines(asperaLegal.tcsPpob.lines),
  ];
}
