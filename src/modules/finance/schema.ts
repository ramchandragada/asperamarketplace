import { z } from "zod";

export const createSettlementSchema = z.object({
  sellerId: z.uuid(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});

export const releaseSettlementSchema = z.object({
  batchId: z.uuid(),
  reason: z.string().trim().min(3).max(500).default("Finance released mock settlement"),
});

export const createReconciliationSchema = z.object({
  kind: z.enum([
    "payment_mismatch",
    "ledger_imbalance",
    "settlement_hold",
    "manual",
  ]),
  reference: z.string().trim().min(3).max(120),
  description: z.string().trim().min(5).max(1000),
  amountPaise: z.number().int().optional(),
});

export const resolveReconciliationSchema = z.object({
  exceptionId: z.uuid(),
  resolution: z.string().trim().min(3).max(1000),
  status: z.enum(["resolved", "written_off"]).default("resolved"),
});

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
export type ReleaseSettlementInput = z.infer<typeof releaseSettlementSchema>;
export type CreateReconciliationInput = z.infer<
  typeof createReconciliationSchema
>;
export type ResolveReconciliationInput = z.infer<
  typeof resolveReconciliationSchema
>;
