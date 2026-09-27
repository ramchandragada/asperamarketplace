export const DEFAULT_COMMISSION_BPS = 1000; // 10%

export const LEDGER_ACCOUNTS = [
  {
    code: "1000",
    name: "Customer collection (cash clearing)",
    accountType: "asset" as const,
  },
  {
    code: "2000",
    name: "Seller payable",
    accountType: "liability" as const,
  },
  {
    code: "2100",
    name: "Refund liability",
    accountType: "liability" as const,
  },
  {
    code: "4000",
    name: "Commission revenue",
    accountType: "revenue" as const,
  },
  {
    code: "4100",
    name: "Shipping revenue",
    accountType: "revenue" as const,
  },
  {
    code: "2200",
    name: "Tax collected",
    accountType: "liability" as const,
  },
] as const;

export function commissionPaise(grossPaise: number, rateBps: number): number {
  return Math.floor((grossPaise * rateBps) / 10_000);
}
