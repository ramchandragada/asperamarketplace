import { z } from "zod";

export const addCartItemSchema = z.object({
  variantId: z.uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const updateCartItemSchema = z.object({
  variantId: z.uuid(),
  quantity: z.number().int().min(0).max(99),
});

export const createAddressSchema = z.object({
  label: z.string().trim().min(1).max(40).default("Home"),
  fullName: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Phone must be a 10-digit Indian mobile number"),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Postal code must be 6 digits"),
  country: z.string().trim().length(2).default("IN"),
  isDefault: z.boolean().optional(),
});

export const previewCheckoutSchema = z.object({
  addressId: z.uuid(),
  couponCode: z.string().trim().min(3).max(40).optional(),
  /** Display hint only. Rejected when it disagrees with the server total. */
  clientTotalPaise: z.number().int().nonnegative().optional(),
});

export const confirmCheckoutSchema = z.object({
  addressId: z.uuid(),
  couponCode: z.string().trim().min(3).max(40).optional(),
  clientTotalPaise: z.number().int().nonnegative().optional(),
  idempotencyKey: z.string().trim().min(8).max(120),
  expectedCartVersion: z.number().int().positive(),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type PreviewCheckoutInput = z.infer<typeof previewCheckoutSchema>;
export type ConfirmCheckoutInput = z.infer<typeof confirmCheckoutSchema>;
