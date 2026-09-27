import { z } from "zod";

export const trackEventSchema = z.object({
  eventName: z.string().trim().min(2).max(80),
  productId: z.uuid().optional(),
  orderId: z.uuid().optional(),
  sellerId: z.uuid().optional(),
  searchQuery: z.string().trim().min(1).max(200).optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});

export const createExperimentSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9_.-]+$/),
  name: z.string().trim().min(3).max(120),
  hypothesis: z.string().trim().min(10).max(1000),
  variants: z
    .array(z.object({ key: z.string(), weight: z.number().int().min(1).max(100) }))
    .min(2)
    .max(6),
});

export const updateExperimentSchema = z.object({
  experimentId: z.uuid(),
  status: z.enum(["draft", "running", "paused", "concluded"]),
});

export type TrackEventInput = z.infer<typeof trackEventSchema>;
export type CreateExperimentInput = z.infer<typeof createExperimentSchema>;
export type UpdateExperimentInput = z.infer<typeof updateExperimentSchema>;

export const EVENT_TAXONOMY = [
  { name: "page_view", description: "Any authenticated or public page view" },
  { name: "product_view", description: "PDP impression" },
  { name: "search", description: "Catalogue search query" },
  { name: "add_to_cart", description: "Cart line added" },
  { name: "checkout_start", description: "Checkout preview opened" },
  { name: "order_paid", description: "Payment succeeded (server-side)" },
  {
    name: "seller_dashboard_view",
    description: "Seller analytics or fulfilment view",
  },
] as const;
