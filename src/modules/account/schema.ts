import { z } from "zod";

const gstinField = z
  .string()
  .trim()
  .toUpperCase()
  .refine(
    (value) =>
      value.length === 0 ||
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value),
    "Enter a valid GSTIN format",
  );

export const updateBuyerProfileSchema = z.object({
  businessName: z.string().trim().max(200).optional(),
  gstin: gstinField.optional(),
  taxInvoicePreferred: z.boolean().optional(),
  preferredPaymentMethod: z.enum(["mock", "online", "cod"]).optional(),
});

export type UpdateBuyerProfileInput = z.infer<typeof updateBuyerProfileSchema>;
