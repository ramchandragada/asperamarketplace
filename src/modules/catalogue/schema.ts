import { z } from "zod";
import { dbUuid } from "@/platform/validation/id";

const CATALOGUE_IMAGE_HOSTS = new Set([
  "images.unsplash.com",
  "plus.unsplash.com",
]);

/** Storefront photos must be https URLs the image optimizer and CSP already allow. */
export const catalogueImageUrlSchema = z
  .string()
  .trim()
  .url()
  .max(500)
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && CATALOGUE_IMAGE_HOSTS.has(url.hostname);
  }, "Image URL must be an https Unsplash photo");

export const createProductSchema = z
  .object({
    sellerId: dbUuid,
    categoryId: dbUuid,
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
    imageUrl: catalogueImageUrlSchema.optional(),
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
  productId: dbUuid,
});

/** Another approved seller lists the same product with their own price and stock. */
export const createProductOfferSchema = z
  .object({
    sellerId: dbUuid,
    /** Approved storefront product this seller wants to also sell. */
    sourceProductId: dbUuid,
    variant: z.object({
      sku: z
        .string()
        .trim()
        .min(3)
        .max(64)
        .regex(/^[A-Z0-9-]+$/, "SKU must be uppercase letters, numbers, or hyphen"),
      title: z.string().trim().min(1).max(120).optional(),
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

export const reviewProductSchema = z.object({
  productId: dbUuid,
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

export const updateSellerProductSchema = z
  .object({
    sellerId: dbUuid,
    productId: dbUuid,
    title: z.string().trim().min(3).max(200).optional(),
    summary: z.string().trim().min(10).max(400).optional(),
    description: z.string().trim().min(20).max(5000).optional(),
    categoryId: dbUuid.optional(),
    /** archive = pause/unlist from storefront */
    status: z.enum(["draft", "archived"]).optional(),
    imageUrl: catalogueImageUrlSchema.optional(),
    variant: z
      .object({
        id: dbUuid,
        mrpPaise: z.number().int().positive().optional(),
        sellingPricePaise: z.number().int().positive().optional(),
        onHand: z.number().int().min(0).max(1_000_000).optional(),
      })
      .optional(),
  })
  .refine(
    (value) =>
      value.variant?.mrpPaise == null ||
      value.variant?.sellingPricePaise == null ||
      value.variant.mrpPaise >= value.variant.sellingPricePaise,
    {
      message: "MRP must be greater than or equal to selling price",
      path: ["variant", "mrpPaise"],
    },
  );

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateProductOfferInput = z.infer<typeof createProductOfferSchema>;
export type UpdateSellerProductInput = z.infer<typeof updateSellerProductSchema>;
export type SubmitProductInput = z.infer<typeof submitProductSchema>;
export type ReviewProductInput = z.infer<typeof reviewProductSchema>;
export type SearchProductsInput = z.infer<typeof searchProductsSchema>;
