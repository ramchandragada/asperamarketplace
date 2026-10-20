import { z } from "zod";
import { dbUuid } from "@/platform/validation/id";

export const createProtectionClaimSchema = z.object({
  orderId: dbUuid,
  orderLineId: dbUuid,
  claimType: z.enum([
    "not_delivered",
    "not_as_described",
    "return_not_honored",
    "other",
  ]),
  description: z.string().trim().min(20).max(2000),
  evidenceUrls: z.array(z.string().url().max(500)).max(5).optional(),
});

export const decideProtectionClaimSchema = z.object({
  claimId: dbUuid,
  decision: z.enum(["approved", "rejected", "seller_resolved", "under_review"]),
  resolutionNote: z.string().trim().min(5).max(2000),
});

export type CreateProtectionClaimInput = z.infer<
  typeof createProtectionClaimSchema
>;
export type DecideProtectionClaimInput = z.infer<
  typeof decideProtectionClaimSchema
>;
