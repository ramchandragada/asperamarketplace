import { z } from "zod";

export const openRiskCaseSchema = z.object({
  subjectType: z.enum(["user", "seller", "order", "product", "payment"]),
  subjectId: z.string().trim().min(1).max(120),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  title: z.string().trim().min(5).max(160),
  details: z.string().trim().min(10).max(4000),
});

export const updateRiskCaseSchema = z.object({
  riskCaseId: z.uuid(),
  status: z.enum(["investigating", "mitigated", "closed"]),
  reason: z.string().trim().min(3).max(500),
});

export const reportCounterfeitSchema = z.object({
  productId: z.uuid(),
  sellerId: z.uuid(),
  brandClaim: z.string().trim().min(2).max(120),
  evidenceNote: z.string().trim().min(10).max(4000),
});

export const reviewCounterfeitSchema = z.object({
  caseId: z.uuid(),
  decision: z.enum(["uphold", "dismiss"]),
  reason: z.string().trim().min(3).max(500),
});

export const createReviewSchema = z.object({
  productId: z.uuid(),
  orderId: z.uuid().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(10).max(4000),
});

export const moderateReviewSchema = z.object({
  reviewId: z.uuid(),
  decision: z.enum(["approve", "reject", "hide"]),
  reason: z.string().trim().min(3).max(500),
});

export const createPrivacyRequestSchema = z.object({
  requestType: z.enum(["access", "erasure", "correction", "portability"]),
  details: z.string().trim().min(10).max(4000),
});

export const updatePrivacyRequestSchema = z.object({
  privacyRequestId: z.uuid(),
  status: z.enum(["in_progress", "completed", "rejected"]),
  reason: z.string().trim().min(3).max(500),
});

export const createComplianceEvidenceSchema = z.object({
  registerKey: z.string().trim().min(2).max(80),
  title: z.string().trim().min(5).max(160),
  summary: z.string().trim().min(10).max(4000),
  evidenceUri: z.string().url().optional(),
});

export const submitComplianceEvidenceSchema = z.object({
  evidenceId: z.uuid(),
  decision: z.enum(["submit", "accept", "reject"]),
  reason: z.string().trim().min(3).max(500).default("Compliance register update"),
});

export type OpenRiskCaseInput = z.infer<typeof openRiskCaseSchema>;
export type UpdateRiskCaseInput = z.infer<typeof updateRiskCaseSchema>;
export type ReportCounterfeitInput = z.infer<typeof reportCounterfeitSchema>;
export type ReviewCounterfeitInput = z.infer<typeof reviewCounterfeitSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;
export type CreatePrivacyRequestInput = z.infer<typeof createPrivacyRequestSchema>;
export type UpdatePrivacyRequestInput = z.infer<typeof updatePrivacyRequestSchema>;
export type CreateComplianceEvidenceInput = z.infer<
  typeof createComplianceEvidenceSchema
>;
export type SubmitComplianceEvidenceInput = z.infer<
  typeof submitComplianceEvidenceSchema
>;
