import { z } from "zod";

export const createProductSchema = z
  .object({
    sellerId: z.uuid(),
    categoryId: z.uuid(),
    brandName: z.string().trim().min(1).max(120).optional(),
    title: z.string().trim().min(3).max(200),
    summary: z.string().trim().min(10).max(400),
    description: z.string().trim().min(20).max(5000),
    countryOfOrigin: z.string().trim().min(2).max(80).optional(),
    hsnCode: z
      .string()
      .trim()
      .regex(/^\d{4,8}$/, "HSN must be 4 to 8 digits")
      .optional(),
    variant: z.object({
      sku: z
        .string()
        .trim()
        .min(3)
        .max(64)
        .regex(/^[A-Z0-9-]+$/, "SKU must be uppercase letters, numbers, or hyphen"),
      title: z.string().trim().min(1).max(120),
      mrpPaise: z.number().int().positive(),
      sellingPricePaise: z.number().int().positive(),
      initialStock: z.number().int().min(0).max(1_000_000),
      weightGrams: z.number().int().positive().optional(),
    }),
  })
  .refine((value) => value.variant.mrpPaise >= value.variant.sellingPricePaise, {
    message: "MRP must be greater than or equal to selling price",
    path: ["variant", "mrpPaise"],
  });

export const submitProductSchema = z.object({
  productId: z.uuid(),
});

export const reviewProductSchema = z.object({
  productId: z.uuid(),
  decision: z.enum(["approve", "reject"]),
  reason: z.string().trim().min(3).max(500),
  expectedVersion: z.number().int().positive(),
});

export const searchProductsSchema = z.object({
  q: z.string().trim().max(120).optional(),
  categorySlug: z.string().trim().max(120).optional(),
  brandSlug: z.string().trim().max(120).optional(),
  /** Fashion/kids audience segment stored on Product.attributes.audience */
  audience: z.enum(["women", "men", "kids", "unisex"]).optional(),
  minPricePaise: z.coerce.number().int().nonnegative().optional(),
  maxPricePaise: z.coerce.number().int().positive().optional(),
  inStockOnly: z.boolean().optional().default(false),
  verifiedSellerOnly: z.boolean().optional().default(false),
  minRating: z.coerce.number().min(0).max(5).optional(),
  minDiscountPercent: z.coerce.number().int().min(0).max(90).optional(),
  sort: z
    .enum(["relevance", "newest", "price_asc", "price_desc", "rating"])
    .optional()
    .default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type SubmitProductInput = z.infer<typeof submitProductSchema>;
export type ReviewProductInput = z.infer<typeof reviewProductSchema>;
export type SearchProductsInput = z.infer<typeof searchProductsSchema>;
