import { z } from "zod";
import { dbUuid } from "@/platform/validation/id";

const indianState = z
  .string()
  .trim()
  .min(2)
  .max(64);

export const createSellerDraftSchema = z.object({
  legalName: z.string().trim().min(2).max(200),
  tradeName: z.string().trim().max(200).optional(),
  contactEmail: z.email().max(320),
  contactPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number")
    .optional(),
  pan: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Enter a valid PAN format"),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
      "Enter a valid GSTIN format",
    ),
  registeredState: indianState,
  pickupCity: z.string().trim().min(2).max(80),
  pickupLine1: z.string().trim().min(5).max(200),
  pickupPostalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a 6-digit pickup pincode"),
  bankAccountHolder: z.string().trim().min(2).max(120),
  bankName: z.string().trim().min(2).max(120).optional(),
  bankIfsc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC"),
  /** Full account number accepted once; only last4 is persisted. */
  bankAccountNumber: z
    .string()
    .trim()
    .regex(/^\d{9,18}$/, "Enter a 9–18 digit account number"),
});

export const submitSellerSchema = z.object({
  sellerId: dbUuid,
  acceptAgreement: z.literal(true),
});

export const reviewSellerSchema = z.object({
  sellerId: dbUuid,
  decision: z.enum([
    "approve",
    "reject",
    "request_info",
    "suspend",
    "reactivate",
  ]),
  reason: z.string().trim().min(3).max(500),
  expectedVersion: z.number().int().positive(),
});

/** Admin: attach a verified Regular GSTIN so a shop can go live. */
export const adminSetSellerGstinSchema = z.object({
  sellerId: dbUuid,
  gstin: createSellerDraftSchema.shape.gstin,
  registeredState: indianState,
  pickupCity: z.string().trim().min(2).max(80),
  expectedVersion: z.number().int().positive(),
  /** When true, re-approve suspended sellers missing GSTIN and republish drafts. */
  republish: z.boolean().default(true),
});

/** Admin: permanently remove a non-live seller application (frees GSTIN). */
export const deleteSellerApplicationSchema = z.object({
  sellerId: dbUuid,
  expectedVersion: z.number().int().positive(),
  reason: z.string().trim().min(3).max(500),
});

export type CreateSellerDraftInput = z.infer<typeof createSellerDraftSchema>;
export type SubmitSellerInput = z.infer<typeof submitSellerSchema>;
export type ReviewSellerInput = z.infer<typeof reviewSellerSchema>;
export type AdminSetSellerGstinInput = z.infer<typeof adminSetSellerGstinSchema>;
export type DeleteSellerApplicationInput = z.infer<
  typeof deleteSellerApplicationSchema
>;
