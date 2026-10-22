/**
 * Catalogue v2 service — shared catalogue + seller offers.
 *
 * Marketplace-owned CatalogueProduct/Variant hold the facts; each SellerOffer
 * holds one seller's price/SKU/condition/stock for a shared variant. This
 * module is additive and gated by `catalogueV2Enabled()`; the storefront only
 * reads it once the flag is flipped (see docs/CATALOGUE_V2_PLAN.md).
 */
import crypto from "node:crypto";
import type { OfferCondition, Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import { buildSearchDocument, slugify } from "./helpers";

export type CreateCatalogueProductInput = {
  categoryId: string;
  brandId?: string | null;
  title: string;
  summary: string;
  description: string;
  countryOfOrigin?: string | null;
  hsnCode?: string | null;
  attributes?: Prisma.InputJsonValue;
  brandName?: string | null;
  categoryName?: string | null;
};

export type AddCatalogueVariantInput = {
  catalogueProductId: string;
  title: string;
  optionValues?: Prisma.InputJsonValue;
  mrpPaise?: number | null;
  weightGrams?: number | null;
  gtin?: string | null;
};

export type CreateSellerOfferInput = {
  sellerId: string;
  catalogueVariantId: string;
  sku: string;
  sellingPricePaise: number;
  mrpPaise: number;
  condition?: OfferCondition;
  dispatchDays?: number | null;
  initialStock?: number;
  status?: ProductStatus;
};

/** A single seller's offer for a shared variant, shaped for the PDP. */
export type OfferView = {
  offerId: string;
  sellerId: string;
  sellerName: string;
  sellerVerified: boolean;
  catalogueVariantId: string;
  variantTitle: string;
  sku: string;
  condition: OfferCondition;
  sellingPricePaise: number;
  mrpPaise: number;
  availableQty: number;
  dispatchDays: number | null;
  /** Buy-box winner: in stock and the lowest price among in-stock offers. */
  isFeatured: boolean;
};

// --- Writes (used by the v2 seed now, the seller flow in a later phase) ---

export async function createCatalogueProduct(
  input: CreateCatalogueProductInput,
) {
  const slug = `${slugify(input.title)}-${crypto.randomUUID().slice(0, 8)}`;
  return prisma.catalogueProduct.create({
    data: {
      slug,
      categoryId: input.categoryId,
      brandId: input.brandId ?? null,
      title: input.title,
      summary: input.summary,
      description: input.description,
      status: "draft",
      countryOfOrigin: input.countryOfOrigin ?? null,
      hsnCode: input.hsnCode ?? null,
      attributes: input.attributes,
      searchDocument: buildSearchDocument({
        title: input.title,
        summary: input.summary,
        description: input.description,
        brandName: input.brandName,
        categoryName: input.categoryName,
      }),
    },
  });
}

export async function addCatalogueVariant(input: AddCatalogueVariantInput) {
  return prisma.catalogueVariant.create({
    data: {
      catalogueProductId: input.catalogueProductId,
      title: input.title,
      optionValues: input.optionValues,
      mrpPaise: input.mrpPaise ?? null,
      weightGrams: input.weightGrams ?? null,
      gtin: input.gtin ?? null,
    },
  });
}

/** Mark a catalogue product live (facts complete) so its offers can show. */
export async function publishCatalogueProduct(id: string) {
  return prisma.catalogueProduct.update({
    where: { id },
    data: { status: "approved", publishedAt: new Date() },
  });
}

export async function createSellerOffer(input: CreateSellerOfferInput) {
  return prisma.sellerOffer.create({
    data: {
      sellerId: input.sellerId,
      catalogueVariantId: input.catalogueVariantId,
      sku: input.sku,
      sellingPricePaise: input.sellingPricePaise,
      mrpPaise: input.mrpPaise,
      condition: input.condition ?? "new",
      dispatchDays: input.dispatchDays ?? null,
      status: input.status ?? "draft",
      inventory: {
        create: { onHand: input.initialStock ?? 0, reserved: 0 },
      },
    },
    include: { inventory: true },
  });
}

// --- Reads (used by the storefront once the flag is flipped) ---

function availableQty(onHand: number, reserved: number): number {
  return Math.max(onHand - reserved, 0);
}

/**
 * Rank a variant's offers for display. In-stock offers sort ahead of
 * out-of-stock ones, then by lowest selling price. The first in-stock,
 * lowest-price offer is the transparent buy-box winner.
 */
export function rankOffers(offers: OfferView[]): OfferView[] {
  const ranked = [...offers].sort((a, b) => {
    const aIn = a.availableQty > 0;
    const bIn = b.availableQty > 0;
    if (aIn !== bIn) return aIn ? -1 : 1;
    if (a.sellingPricePaise !== b.sellingPricePaise) {
      return a.sellingPricePaise - b.sellingPricePaise;
    }
    return a.dispatchDays != null && b.dispatchDays != null
      ? a.dispatchDays - b.dispatchDays
      : 0;
  });
  const winner = ranked.find((offer) => offer.availableQty > 0);
  return ranked.map((offer) => ({
    ...offer,
    isFeatured: winner != null && offer.offerId === winner.offerId,
  }));
}

/** Approved offers for one shared variant, ranked, with a featured winner. */
export async function listOffersForCatalogueVariant(
  catalogueVariantId: string,
): Promise<OfferView[]> {
  const variant = await prisma.catalogueVariant.findUnique({
    where: { id: catalogueVariantId },
    include: {
      offers: {
        where: { status: "approved" },
        include: {
          inventory: true,
          seller: {
            select: { id: true, legalName: true, tradeName: true, status: true },
          },
        },
      },
    },
  });
  if (!variant) return [];
  const views: OfferView[] = variant.offers.map((offer) => ({
    offerId: offer.id,
    sellerId: offer.seller.id,
    sellerName: offer.seller.tradeName ?? offer.seller.legalName,
    sellerVerified: offer.seller.status === "approved",
    catalogueVariantId: variant.id,
    variantTitle: variant.title,
    sku: offer.sku,
    condition: offer.condition,
    sellingPricePaise: offer.sellingPricePaise,
    mrpPaise: offer.mrpPaise,
    availableQty: availableQty(
      offer.inventory?.onHand ?? 0,
      offer.inventory?.reserved ?? 0,
    ),
    dispatchDays: offer.dispatchDays,
    isFeatured: false,
  }));
  return rankOffers(views);
}

/** A catalogue product with its variants and ranked offers, shaped for a PDP. */
export async function getCatalogueProductBySlug(slug: string) {
  const product = await prisma.catalogueProduct.findFirst({
    where: { slug, status: "approved" },
    include: {
      category: true,
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true } },
    },
  });
  if (!product) return null;

  const variants = await Promise.all(
    product.variants.map(async (variant) => ({
      id: variant.id,
      title: variant.title,
      optionValues: variant.optionValues,
      mrpPaise: variant.mrpPaise,
      offers: await listOffersForCatalogueVariant(variant.id),
    })),
  );

  return { ...product, variants };
}

/** Lowest approved, in-stock offer price for a catalogue product (buy box). */
export async function bestOfferPricePaise(
  catalogueProductId: string,
): Promise<number | null> {
  const row = await prisma.sellerOffer.findFirst({
    where: {
      status: "approved",
      catalogueVariant: { catalogueProductId },
      inventory: { onHand: { gt: 0 } },
    },
    orderBy: { sellingPricePaise: "asc" },
    select: { sellingPricePaise: true },
  });
  return row?.sellingPricePaise ?? null;
}
