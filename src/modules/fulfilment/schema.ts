import { z } from "zod";
import { dbUuid } from "@/platform/validation/id";

export const startProcessingSchema = z.object({
  fulfilmentGroupId: dbUuid,
  reason: z.string().trim().min(3).max(200).default("Seller started processing"),
});

export const shipGroupSchema = z.object({
  fulfilmentGroupId: dbUuid,
  carrier: z.string().trim().min(2).max(80).default("Mock Logistics"),
  trackingNumber: z.string().trim().min(5).max(64).optional(),
});

export const markDeliveredSchema = z.object({
  fulfilmentGroupId: dbUuid,
});

export const cancelGroupSchema = z.object({
  fulfilmentGroupId: dbUuid,
  reason: z.string().trim().min(3).max(500),
});

export const createReturnSchema = z.object({
  orderId: dbUuid,
  orderLineId: dbUuid.optional(),
  sellerId: dbUuid,
  quantity: z.number().int().min(1).max(99).default(1),
  reason: z.string().trim().min(5).max(500),
});

export const reviewReturnSchema = z.object({
  returnRequestId: dbUuid,
  decision: z.enum(["approve", "reject"]),
  reason: z.string().trim().min(3).max(500),
});

export const createTicketSchema = z.object({
  orderId: dbUuid.optional(),
  subject: z.string().trim().min(5).max(160),
  body: z.string().trim().min(10).max(4000),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
});

export const createDisputeSchema = z.object({
  orderId: dbUuid,
  sellerId: dbUuid,
  reason: z.string().trim().min(10).max(1000),
});

export type StartProcessingInput = z.infer<typeof startProcessingSchema>;
export type ShipGroupInput = z.infer<typeof shipGroupSchema>;
export type MarkDeliveredInput = z.infer<typeof markDeliveredSchema>;
export type CancelGroupInput = z.infer<typeof cancelGroupSchema>;
export type CreateReturnInput = z.infer<typeof createReturnSchema>;
export type ReviewReturnInput = z.infer<typeof reviewReturnSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;
