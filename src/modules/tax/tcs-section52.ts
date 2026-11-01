/**
 * GST TCS under CGST Act section 52 — Electronic Commerce Operator.
 * Distinct from Income-tax TCS u/s 206C(1H) (see computeMarketplaceTcs).
 *
 * Buyer price is NOT inflated by TCS. TCS is withheld from seller settlement.
 * Use Aspera TCS GSTIN 27AAXCA0147N1CF for GSTR-8 reporting — never the Regular GSTIN.
 */
import { asperaLegal } from "@/platform/config/aspera-legal";
import { stateCodeFor } from "@/modules/tax/gst";

export type TcsSection52Rates = {
  /** Basis points: 50 = 0.5%. */
  cgstBps: number;
  sgstBps: number;
  igstBps: number;
};

export type TcsSection52Line = {
  supplyType: "intra_state" | "inter_state";
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  tcsPaise: number;
  rates: TcsSection52Rates;
  tcsGstin: string;
  ecoLegalName: string;
};

function envBps(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Notified rates — overridable via env without code change. */
export function getTcsSection52Rates(): TcsSection52Rates {
  return {
    cgstBps: envBps("TCS_CGST_BPS", 50),
    sgstBps: envBps("TCS_SGST_BPS", 50),
    igstBps: envBps("TCS_IGST_BPS", 100),
  };
}

export function tcsEnabled(): boolean {
  const flag = process.env.TCS_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  return true;
}

function bpsOf(paise: number, bps: number): number {
  if (paise <= 0 || bps <= 0) return 0;
  return Math.floor((paise * bps) / 10_000);
}

/**
 * Compute section 52 TCS on net taxable value of supplies by a third-party seller.
 * Own-account Aspera inventory must not call this (Regular supply, not TCS).
 */
export function computeTcsSection52(input: {
  taxablePaise: number;
  originState: string;
  destinationState: string;
}): TcsSection52Line {
  const rates = getTcsSection52Rates();
  const taxablePaise = Math.max(0, Math.floor(input.taxablePaise));
  const originCode = stateCodeFor(input.originState);
  const destinationCode = stateCodeFor(input.destinationState);
  const intra =
    originCode != null &&
    destinationCode != null &&
    originCode === destinationCode;

  if (!tcsEnabled() || taxablePaise <= 0) {
    return {
      supplyType: intra ? "intra_state" : "inter_state",
      taxablePaise,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      tcsPaise: 0,
      rates,
      tcsGstin: process.env.TCS_GSTIN?.trim() || asperaLegal.gstinTcs,
      ecoLegalName: asperaLegal.legalEntity,
    };
  }

  if (intra) {
    const cgstPaise = bpsOf(taxablePaise, rates.cgstBps);
    const sgstPaise = bpsOf(taxablePaise, rates.sgstBps);
    return {
      supplyType: "intra_state",
      taxablePaise,
      cgstPaise,
      sgstPaise,
      igstPaise: 0,
      tcsPaise: cgstPaise + sgstPaise,
      rates,
      tcsGstin: process.env.TCS_GSTIN?.trim() || asperaLegal.gstinTcs,
      ecoLegalName: asperaLegal.legalEntity,
    };
  }

  const igstPaise = bpsOf(taxablePaise, rates.igstBps);
  return {
    supplyType: "inter_state",
    taxablePaise,
    cgstPaise: 0,
    sgstPaise: 0,
    igstPaise,
    tcsPaise: igstPaise,
    rates,
    tcsGstin: process.env.TCS_GSTIN?.trim() || asperaLegal.gstinTcs,
    ecoLegalName: asperaLegal.legalEntity,
  };
}
