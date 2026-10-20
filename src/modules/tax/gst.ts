/** Canonical Indian state / UT names → GST state codes (first 2 GSTIN digits). */
export const INDIA_STATE_CODES: Record<string, string> = {
  "andaman and nicobar islands": "35",
  "andhra pradesh": "37",
  "arunachal pradesh": "12",
  assam: "18",
  bihar: "10",
  chandigarh: "04",
  chhattisgarh: "22",
  "dadra and nagar haveli and daman and diu": "26",
  delhi: "07",
  goa: "30",
  gujarat: "24",
  haryana: "06",
  "himachal pradesh": "02",
  "jammu and kashmir": "01",
  jharkhand: "20",
  karnataka: "29",
  kerala: "32",
  ladakh: "38",
  lakshadweep: "31",
  "madhya pradesh": "23",
  maharashtra: "27",
  manipur: "14",
  meghalaya: "17",
  mizoram: "15",
  nagaland: "13",
  odisha: "21",
  puducherry: "34",
  punjab: "03",
  rajasthan: "08",
  sikkim: "11",
  "tamil nadu": "33",
  telangana: "36",
  tripura: "16",
  "uttar pradesh": "09",
  uttarakhand: "05",
  "west bengal": "19",
};

export function normalizeStateName(state: string): string {
  return state.trim().toLowerCase().replace(/\s+/g, " ");
}

export function stateCodeFor(state: string | null | undefined): string | null {
  if (!state) return null;
  const normalized = normalizeStateName(state);
  if (INDIA_STATE_CODES[normalized]) return INDIA_STATE_CODES[normalized];
  // Allow raw 2-digit codes
  if (/^\d{2}$/.test(state.trim())) return state.trim();
  return null;
}

export type GstSplit = {
  supplyType: "intra_state" | "inter_state";
  originState: string;
  destinationState: string;
  originCode: string | null;
  destinationCode: string | null;
  rateBps: number;
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  taxPaise: number;
};

/**
 * Split GST for a taxable amount using seller origin vs ship-to destination.
 * Same state codes → CGST + SGST; otherwise IGST. Half rates are floored so
 * CGST+SGST never exceeds the headline tax.
 */
export function splitGst(input: {
  taxablePaise: number;
  rateBps: number;
  originState: string;
  destinationState: string;
}): GstSplit {
  const originCode = stateCodeFor(input.originState);
  const destinationCode = stateCodeFor(input.destinationState);
  const taxPaise = Math.floor((input.taxablePaise * input.rateBps) / 10_000);
  const sameState =
    originCode != null &&
    destinationCode != null &&
    originCode === destinationCode;

  if (sameState) {
    const cgstPaise = Math.floor(taxPaise / 2);
    const sgstPaise = taxPaise - cgstPaise;
    return {
      supplyType: "intra_state",
      originState: input.originState,
      destinationState: input.destinationState,
      originCode,
      destinationCode,
      rateBps: input.rateBps,
      taxablePaise: input.taxablePaise,
      cgstPaise,
      sgstPaise,
      igstPaise: 0,
      taxPaise,
    };
  }

  return {
    supplyType: "inter_state",
    originState: input.originState,
    destinationState: input.destinationState,
    originCode,
    destinationCode,
    rateBps: input.rateBps,
    taxablePaise: input.taxablePaise,
    cgstPaise: 0,
    sgstPaise: 0,
    igstPaise: taxPaise,
    taxPaise,
  };
}

/** Marketplace TCS u/s 206C(1H) — 0.5% of net seller consideration (goods). */
export const MARKETPLACE_TCS_BPS = 50;

export function computeMarketplaceTcs(netConsiderationPaise: number): number {
  if (netConsiderationPaise <= 0) return 0;
  return Math.floor((netConsiderationPaise * MARKETPLACE_TCS_BPS) / 10_000);
}
