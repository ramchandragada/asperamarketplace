import { z } from "zod";

export const startProcessingSchema = z.object({
  fulfilmentGroupId: z.uuid(),
  reason: z.string().trim().min(3).max(200).default("Seller started processing"),
});

export const shipGroupSchema = z.object({
  fulfilmentGroupId: z.uuid(),
  carrier: z.string().trim().min(2).max(80).default("Mock Logistics"),
  trackingNumber: z.string().trim().min(5).max(64).optional(),
});

export const markDeliveredSchema = z.object({
  fulfilmentGroupId: z.uuid(),
});

export const cancelGroupSchema = z.object({
  fulfilmentGroupId: z.uuid(),
  reason: z.string().trim().min(3).max(500),
});

export const createReturnSchema = z.object({
  orderId: z.uuid(),
  orderLineId: z.uuid().optional(),
  sellerId: z.uuid(),
  quantity: z.number().int().min(1).max(99).default(1),
  reason: z.string().trim().min(5).max(500),
});

export const reviewReturnSchema = z.object({
  returnRequestId: z.uuid(),
  decision: z.enum(["approve", "reject"]),
  reason: z.string().trim().min(3).max(500),
});

export const createTicketSchema = z.object({
  orderId: z.uuid().optional(),
  subject: z.string().trim().min(5).max(160),
  body: z.string().trim().min(10).max(4000),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
});

export const createDisputeSchema = z.object({
  orderId: z.uuid(),
  sellerId: z.uuid(),
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
