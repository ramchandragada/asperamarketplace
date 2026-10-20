import { z } from "zod";
import { dbUuid } from "@/platform/validation/id";

export const createOrderFromCheckoutSchema = z.object({
  checkoutSessionId: dbUuid,
  idempotencyKey: z.string().trim().min(8).max(120),
});

export const startPaymentSchema = z.object({
  orderId: dbUuid,
  idempotencyKey: z.string().trim().min(8).max(120),
});

export const mockCompletePaymentSchema = z.object({
  paymentAttemptId: dbUuid,
  outcome: z.enum(["succeeded", "failed"]),
  failureReason: z.string().trim().min(3).max(200).optional(),
});

export type CreateOrderFromCheckoutInput = z.infer<
  typeof createOrderFromCheckoutSchema
>;
export type StartPaymentInput = z.infer<typeof startPaymentSchema>;
export type MockCompletePaymentInput = z.infer<typeof mockCompletePaymentSchema>;
