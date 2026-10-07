import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/platform/db/prisma";
import {
  AuthorizationError,
  actorIsAdmin,
  requireSellerCapability,
  type Actor,
} from "@/modules/identity/policy";
import {
  assertProductTransition,
  buildSearchDocument,
  discountPercent,
  resolveProductBadge,
  slugify,
  type ProductCardBadge,
} from "@/modules/catalogue/helpers";
import {
  freeDeliveryHintFromPolicy,
  resolveStorefrontRating,
} from "@/modules/catalogue/claims";
import { SHIPPING_POLICY } from "@/modules/cart/pricing";
import { releaseExpiredCheckoutReservations } from "@/modules/cart/reservations";
import {
  searchProductsSchema,
  type CreateProductInput,
  type CreateProductOfferInput,
  type ReviewProductInput,
  type SubmitProductInput,
} from "@/modules/catalogue/schema";

async function requireApprovedSellerOwnership(actor: Actor, sellerId: string) {
  const seller = await prisma.seller.findUniqueOrThrow({
    where: { id: sellerId },
  });
  if (seller.status !== "approved") {
    throw new AuthorizationError("Only approved sellers can manage listings");
  }
  if (seller.ownerUserId === actor.userId || actorIsAdmin(actor)) {
    return seller;
  }
  requireSellerCapability(actor, sellerId, "catalogue.write");
  return seller;
}

export async function listActiveCategories() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: { where: { status: "approved" } } },
      },
    },
  });
  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    parentId: category.parentId,
    isActive: category.isActive,
    productCount: category._count.products,
  }));
}

export async function listActiveBrands() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: { where: { status: "approved" } } },
      },
    },
  });
  return brands
    .filter((brand) => brand._count.products > 0)
    .map((brand) => ({
      id: brand.id,
      slug: brand.slug,
      name: brand.name,
      productCount: brand._count.products,
    }));
}

export async function ensureGenericCategory() {
  return prisma.category.upsert({
    where: { slug: "general-merchandise" },
    create: {
      slug: "general-merchandise",
      name: "General merchandise",
      description:
        "Configurable seed category. Not a launch-category business decision.",
      isActive: true,
    },
    update: {
      isActive: true,
    },
  });
}

export async function createProductDraft(
  actor: Actor,
  input: CreateProductInput,
  correlationId: string,
) {
  const seller = await requireApprovedSellerOwnership(actor, input.sellerId);
  const category = await prisma.category.findFirstOrThrow({
    where: { id: input.categoryId, isActive: true },
  });

  let brandId: string | undefined;
  if (input.brandName) {
    const brandSlug = slugify(input.brandName);
    const brand = await prisma.brand.upsert({
      where: { slug: brandSlug },
      create: { slug: brandSlug, name: input.brandName },
      update: { name: input.brandName },
    });
    brandId = brand.id;
  }

  const baseSlug = slugify(input.title);
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
  const searchDocument = buildSearchDocument({
    title: input.title,
    summary: input.summary,
    description: input.description,
    brandName: input.brandName,
    categoryName: category.name,
    sku: input.variant.sku,
  });

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        sellerId: seller.id,
        categoryId: category.id,
        brandId,
        slug,
        title: input.title,
        summary: input.summary,
        description: input.description,
        status: "draft",
        countryOfOrigin: input.countryOfOrigin,
        hsnCode: input.hsnCode,
        searchDocument,
      },
    });

    if (input.imageUrl) {
      await tx.productImage.create({
        data: {
          productId: product.id,
          url: input.imageUrl,
          altText: input.title,
          sortOrder: 0,
          isPrimary: true,
        },
      });
    }

    const variant = await tx.productVariant.create({
      data: {
        productId: product.id,
        sku: input.variant.sku,
        title: input.variant.title,
        mrpPaise: input.variant.mrpPaise,
        sellingPricePaise: input.variant.sellingPricePaise,
        weightGrams: input.variant.weightGrams,
      },
    });

    const inventory = await tx.inventoryItem.create({
      data: {
        variantId: variant.id,
        sellerId: seller.id,
        onHand: input.variant.initialStock,
        reserved: 0,
        damaged: 0,
      },
    });

    if (input.variant.initialStock > 0) {
      await tx.stockMovement.create({
        data: {
          inventoryItemId: inventory.id,
          movementType: "receive",
          quantity: input.variant.initialStock,
          reason: "Initial stock on product draft",
          actorId: actor.userId,
          correlationId,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "product.draft_created",
        targetType: "product",
        targetId: product.id,
        afterState: {
          title: product.title,
          status: product.status,
          sku: variant.sku,
          sellingPricePaise: variant.sellingPricePaise,
          onHand: inventory.onHand,
        },
        reason: "Seller created catalogue draft",
        correlationId,
      },
    });

    return { product, variant, inventory };
  });
}

/**
 * Lets an approved seller create their own listing of an existing approved product.
 * Catalogue copy and images are copied; price, SKU, and stock stay with this seller.
 * Cart and fulfilment keep using that seller's variant (existing multi-seller checkout).
 */
export async function createProductOffer(
  actor: Actor,
  input: CreateProductOfferInput,
  correlationId: string,
) {
  const seller = await requireApprovedSellerOwnership(actor, input.sellerId);
  const source = await prisma.product.findFirst({
    where: { id: input.sourceProductId, status: "approved" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
      brand: true,
      variants: {
        where: { isActive: true },
        orderBy: { sellingPricePaise: "asc" },
        take: 1,
      },
    },
  });
  if (!source) {
    throw new CatalogueValidationError(
      "Source product must be an approved storefront listing",
    );
  }
  if (source.sellerId === seller.id) {
    throw new CatalogueValidationError(
      "You already sell this product — edit your existing listing instead",
    );
  }

  const sharedListingKey =
    source.sharedListingKey ?? `listing-${source.id.replace(/-/g, "").slice(0, 16)}`;

  const existingOffer = await prisma.product.findFirst({
    where: {
      sharedListingKey,
      sellerId: seller.id,
      status: { not: "archived" },
    },
  });
  if (existingOffer) {
    throw new CatalogueConflictError(
      "You already have a listing for this product",
    );
  }

  const baseSlug = slugify(source.title);
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
  const brandName = source.brand?.name;
  const searchDocument = buildSearchDocument({
    title: source.title,
    summary: source.summary,
    description: source.description,
    brandName,
    categoryName: source.category.name,
    sku: input.variant.sku,
  });
  const weightGrams =
    input.variant.weightGrams ?? source.variants[0]?.weightGrams ?? undefined;

  return prisma.$transaction(async (tx) => {
    if (!source.sharedListingKey) {
      await tx.product.update({
        where: { id: source.id },
        data: { sharedListingKey },
      });
    }

    const product = await tx.product.create({
      data: {
        sellerId: seller.id,
        categoryId: source.categoryId,
        brandId: source.brandId,
        slug,
        title: source.title,
        summary: source.summary,
        description: source.description,
        status: "draft",
        countryOfOrigin: source.countryOfOrigin,
        hsnCode: source.hsnCode,
        sharedListingKey,
        attributes: source.attributes ?? undefined,
        searchDocument,
      },
    });

    for (const [index, image] of source.images.entries()) {
      await tx.productImage.create({
        data: {
          productId: product.id,
          url: image.url,
          altText: image.altText,
          sortOrder: image.sortOrder ?? index,
          isPrimary: image.isPrimary || index === 0,
        },
      });
    }

    const variant = await tx.productVariant.create({
      data: {
        productId: product.id,
        sku: input.variant.sku,
        title: input.variant.title ?? source.variants[0]?.title ?? "Standard",
        mrpPaise: input.variant.mrpPaise,
        sellingPricePaise: input.variant.sellingPricePaise,
        weightGrams,
      },
    });

    const inventory = await tx.inventoryItem.create({
      data: {
        variantId: variant.id,
        sellerId: seller.id,
        onHand: input.variant.initialStock,
        reserved: 0,
        damaged: 0,
      },
    });

    if (input.variant.initialStock > 0) {
      await tx.stockMovement.create({
        data: {
          inventoryItemId: inventory.id,
          movementType: "receive",
          quantity: input.variant.initialStock,
          reason: "Initial stock on multi-seller offer draft",
          actorId: actor.userId,
          correlationId,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "product.offer_draft_created",
        targetType: "product",
        targetId: product.id,
        afterState: {
          title: product.title,
          status: product.status,
          sharedListingKey,
          sourceProductId: source.id,
          sku: variant.sku,
          sellingPricePaise: variant.sellingPricePaise,
          onHand: inventory.onHand,
        },
        reason: "Seller created offer on an existing product",
        correlationId,
      },
    });

    return { product, variant, inventory, sharedListingKey, sourceProductId: source.id };
  });
}

export type SiblingSellerOffer = {
  productId: string;
  slug: string;
  sellerId: string;
  sellerName: string;
  sellerVerified: boolean;
  sellingPricePaise: number;
  mrpPaise: number;
  availableQty: number;
  isCurrent: boolean;
};

/** Other approved sellers offering the same shared listing (excluding empty keys). */
export async function listSiblingSellerOffers(
  productId: string,
): Promise<SiblingSellerOffer[]> {
  const product = await prisma.product.findFirst({
    where: { id: productId, status: "approved" },
    select: { id: true, sharedListingKey: true },
  });
  if (!product?.sharedListingKey) {
    return [];
  }

  const siblings = await prisma.product.findMany({
    where: {
      sharedListingKey: product.sharedListingKey,
      status: "approved",
    },
    include: {
      seller: {
        select: {
          id: true,
          legalName: true,
          tradeName: true,
          status: true,
        },
      },
      variants: {
        where: { isActive: true },
        include: { inventory: true },
      },
    },
  });

  return siblings
    .map((sibling) => {
      let sellingPricePaise = Number.POSITIVE_INFINITY;
      let mrpPaise = Number.POSITIVE_INFINITY;
      let availableQty = 0;
      for (const variant of sibling.variants) {
        sellingPricePaise = Math.min(sellingPricePaise, variant.sellingPricePaise);
        mrpPaise = Math.min(mrpPaise, variant.mrpPaise);
        availableQty += Math.max(
          (variant.inventory?.onHand ?? 0) - (variant.inventory?.reserved ?? 0),
          0,
        );
      }
      if (!Number.isFinite(sellingPricePaise)) {
        return null;
      }
      return {
        productId: sibling.id,
        slug: sibling.slug,
        sellerId: sibling.seller.id,
        sellerName: sibling.seller.tradeName ?? sibling.seller.legalName,
        sellerVerified: sibling.seller.status === "approved",
        sellingPricePaise,
        mrpPaise: Number.isFinite(mrpPaise) ? mrpPaise : sellingPricePaise,
        availableQty,
        isCurrent: sibling.id === product.id,
      } satisfies SiblingSellerOffer;
    })
    .filter((row): row is SiblingSellerOffer => row != null)
    .sort((a, b) => {
      if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
      if ((a.availableQty > 0) !== (b.availableQty > 0)) {
        return a.availableQty > 0 ? -1 : 1;
      }
      return a.sellingPricePaise - b.sellingPricePaise;
    });
}

export async function submitProductForReview(
  actor: Actor,
  input: SubmitProductInput,
  correlationId: string,
) {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: input.productId },
    include: { variants: { include: { inventory: true } }, seller: true },
  });
  await requireApprovedSellerOwnership(actor, product.sellerId);
  assertProductTransition(product.status, "submitted");
  if (product.variants.length < 1) {
    throw new CatalogueValidationError("A product needs at least one variant");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: product.id, version: product.version },
      data: {
        status: "submitted",
        submittedAt: new Date(),
        version: { increment: 1 },
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "product.submitted",
        targetType: "product",
        targetId: product.id,
        beforeState: { status: product.status, version: product.version },
        afterState: { status: updated.status, version: updated.version },
        reason: "Seller submitted listing for moderation",
        correlationId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType: "ProductSubmitted",
        aggregateType: "product",
        aggregateId: product.id,
        payload: { status: updated.status, sellerId: product.sellerId },
      },
    });
    return updated;
  });
}

export async function reviewProduct(
  actor: Actor,
  input: ReviewProductInput,
  correlationId: string,
) {
  if (!actorIsAdmin(actor)) {
    throw new AuthorizationError("Administrator role required");
  }
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: input.productId },
  });
  if (product.version !== input.expectedVersion) {
    throw new CatalogueConflictError(
      "Product was updated by another operator. Reload and retry.",
    );
  }
  const nextStatus = input.decision === "approve" ? "approved" : "rejected";
  assertProductTransition(product.status, nextStatus);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: product.id, version: product.version },
      data: {
        status: nextStatus,
        statusReason: input.reason,
        reviewedAt: new Date(),
        reviewedByUserId: actor.userId,
        publishedAt: nextStatus === "approved" ? new Date() : null,
        version: { increment: 1 },
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action:
          nextStatus === "approved" ? "product.approved" : "product.rejected",
        targetType: "product",
        targetId: product.id,
        beforeState: { status: product.status, version: product.version },
        afterState: {
          status: updated.status,
          version: updated.version,
          reason: input.reason,
        },
        reason: input.reason,
        correlationId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType:
          nextStatus === "approved" ? "ProductApproved" : "ProductRejected",
        aggregateType: "product",
        aggregateId: product.id,
        payload: {
          status: updated.status,
          reason: input.reason,
          reviewedByUserId: actor.userId,
        },
      },
    });
    return updated;
  });
}

export async function listSellerProducts(
  actor: Actor,
  sellerId: string,
  options?: {
    q?: string;
    status?: "draft" | "submitted" | "approved" | "rejected" | "archived";
    stock?: "in" | "low" | "out";
    page?: number;
    pageSize?: number;
  },
) {
  await requireApprovedSellerOwnership(actor, sellerId);
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, options?.pageSize ?? 25));
  const q = options?.q?.trim();

  const where: Prisma.ProductWhereInput = {
    sellerId,
    ...(options?.status ? { status: options.status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  const include = {
    category: true,
    brand: true,
    images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
    variants: { include: { inventory: true } },
  };

  if (options?.stock) {
    const all = await prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 500,
      include,
    });
    const filtered = all.filter((product) => {
      const available = product.variants.reduce((sum, variant) => {
        const onHand = variant.inventory?.onHand ?? 0;
        const reserved = variant.inventory?.reserved ?? 0;
        return sum + Math.max(onHand - reserved, 0);
      }, 0);
      if (options.stock === "out") return available === 0;
      if (options.stock === "low") return available > 0 && available <= 5;
      return available > 5;
    });
    const total = filtered.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, pageCount);
    const start = (safePage - 1) * pageSize;
    return {
      items: filtered.slice(start, start + pageSize),
      page: safePage,
      pageSize,
      total,
      pageCount,
    };
  }

  const total = await prisma.product.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const items = await prisma.product.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: (safePage - 1) * pageSize,
    take: pageSize,
    include,
  });

  return { items, page: safePage, pageSize, total, pageCount };
}

export async function getSellerProduct(
  actor: Actor,
  sellerId: string,
  productId: string,
) {
  await requireApprovedSellerOwnership(actor, sellerId);
  return prisma.product.findFirst({
    where: { id: productId, sellerId },
    include: {
      category: true,
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { include: { inventory: true } },
    },
  });
}

export async function updateSellerProduct(
  actor: Actor,
  input: {
    sellerId: string;
    productId: string;
    title?: string;
    summary?: string;
    description?: string;
    categoryId?: string;
    status?: "draft" | "archived" | "approved";
    imageUrl?: string;
    variant?: {
      id: string;
      mrpPaise?: number;
      sellingPricePaise?: number;
      onHand?: number;
    };
  },
  correlationId: string,
) {
  await requireApprovedSellerOwnership(actor, input.sellerId);
  const existing = await prisma.product.findFirst({
    where: { id: input.productId, sellerId: input.sellerId },
    include: {
      variants: { include: { inventory: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
  if (!existing) {
    throw new CatalogueValidationError("Product not found for this seller");
  }

  if (
    input.variant &&
    input.variant.mrpPaise != null &&
    input.variant.sellingPricePaise != null &&
    input.variant.mrpPaise < input.variant.sellingPricePaise
  ) {
    throw new CatalogueValidationError(
      "MRP must be greater than or equal to selling price",
    );
  }

  const contentChanged =
    (input.title != null && input.title !== existing.title) ||
    (input.summary != null && input.summary !== existing.summary) ||
    (input.description != null && input.description !== existing.description) ||
    (input.categoryId != null && input.categoryId !== existing.categoryId) ||
    (input.imageUrl != null &&
      input.imageUrl !== (existing.images[0]?.url ?? null));

  return prisma.$transaction(async (tx) => {
    let nextStatus = existing.status;
    let statusReason = existing.statusReason;
    let publishedAt = existing.publishedAt;
    let submittedAt = existing.submittedAt;

    if (input.status === "archived" || input.status === "draft") {
      assertProductTransition(existing.status, input.status);
      nextStatus = input.status;
      publishedAt = null;
      statusReason =
        input.status === "archived" ? "Paused by seller" : statusReason;
    } else if (contentChanged && existing.status === "approved") {
      assertProductTransition("approved", "submitted");
      nextStatus = "submitted";
      publishedAt = null;
      submittedAt = new Date();
      statusReason = "Seller updated listing content — awaiting review";
    }

    const product = await tx.product.update({
      where: { id: existing.id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.summary ? { summary: input.summary } : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.categoryId ? { categoryId: input.categoryId } : {}),
        status: nextStatus,
        statusReason,
        publishedAt,
        submittedAt,
        version: { increment: 1 },
      },
    });

    if (input.imageUrl) {
      await tx.productImage.deleteMany({ where: { productId: product.id } });
      await tx.productImage.create({
        data: {
          productId: product.id,
          url: input.imageUrl,
          altText: product.title,
          sortOrder: 0,
          isPrimary: true,
        },
      });
    }

    if (input.variant) {
      const variant = existing.variants.find((row) => row.id === input.variant!.id);
      if (!variant) {
        throw new CatalogueValidationError("Variant not found on this product");
      }
      await tx.productVariant.update({
        where: { id: variant.id },
        data: {
          ...(input.variant.mrpPaise != null
            ? { mrpPaise: input.variant.mrpPaise }
            : {}),
          ...(input.variant.sellingPricePaise != null
            ? { sellingPricePaise: input.variant.sellingPricePaise }
            : {}),
        },
      });
      if (input.variant.onHand != null && variant.inventory) {
        if (input.variant.onHand < variant.inventory.reserved) {
          throw new CatalogueValidationError(
            `On-hand stock cannot be less than reserved (${variant.inventory.reserved})`,
          );
        }
        await tx.inventoryItem.update({
          where: { id: variant.inventory.id },
          data: { onHand: input.variant.onHand, version: { increment: 1 } },
        });
        await tx.stockMovement.create({
          data: {
            inventoryItemId: variant.inventory.id,
            movementType: "adjust",
            quantity: input.variant.onHand - variant.inventory.onHand,
            reason: "Seller stock update",
            actorId: actor.userId,
            correlationId,
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: contentChanged
          ? "product.seller_content_updated"
          : "product.seller_updated",
        targetType: "product",
        targetId: product.id,
        beforeState: {
          title: existing.title,
          status: existing.status,
          categoryId: existing.categoryId,
        },
        afterState: {
          title: product.title,
          status: product.status,
          categoryId: product.categoryId,
          contentChanged,
          variant: input.variant ?? null,
        },
        reason: contentChanged
          ? "Seller updated listing content"
          : "Seller updated listing",
        correlationId,
      },
    });

    return getSellerProduct(actor, input.sellerId, product.id);
  });
}

export async function listSellerInventory(
  actor: Actor,
  sellerId: string,
  options?: {
    filter?: "all" | "low_stock" | "out_of_stock";
    q?: string;
    page?: number;
    pageSize?: number;
  },
) {
  await requireApprovedSellerOwnership(actor, sellerId);
  const filter = options?.filter ?? "all";
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, options?.pageSize ?? 25));
  const q = options?.q?.trim();

  const rows = await prisma.inventoryItem.findMany({
    where: {
      sellerId,
      variant: {
        isActive: true,
        product: {
          sellerId,
          ...(q
            ? {
                OR: [
                  { title: { contains: q, mode: "insensitive" } },
                  {
                    variants: {
                      some: { sku: { contains: q, mode: "insensitive" } },
                    },
                  },
                ],
              }
            : {}),
        },
      },
    },
    include: {
      variant: {
        select: {
          id: true,
          sku: true,
          title: true,
          mrpPaise: true,
          sellingPricePaise: true,
          product: { select: { id: true, title: true, status: true, slug: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 2000,
  });
  const mapped = rows
    .map((row) => ({
      inventoryItemId: row.id,
      productId: row.variant.product.id,
      productTitle: row.variant.product.title,
      productStatus: row.variant.product.status,
      slug: row.variant.product.slug,
      variantId: row.variant.id,
      sku: row.variant.sku,
      variantTitle: row.variant.title,
      mrpPaise: row.variant.mrpPaise,
      sellingPricePaise: row.variant.sellingPricePaise,
      onHand: row.onHand,
      reserved: row.reserved,
      available: Math.max(row.onHand - row.reserved, 0),
    }))
    .filter((row) => {
      if (filter === "out_of_stock") return row.available === 0;
      if (filter === "low_stock") return row.available > 0 && row.available <= 5;
      return true;
    })
    .sort((a, b) => a.available - b.available);

  const total = mapped.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    items: mapped.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    pageCount,
  };
}

export async function listProductsForModeration(actor: Actor) {
  if (!actorIsAdmin(actor)) {
    throw new AuthorizationError("Administrator role required");
  }
  return prisma.product.findMany({
    where: { status: { in: ["submitted", "approved", "rejected"] } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      seller: { select: { id: true, legalName: true, tradeName: true } },
      category: true,
      variants: { include: { inventory: true } },
    },
  });
}

const ADMIN_PRODUCT_TAB_STATUS = {
  pending: "submitted",
  approved: "approved",
  rejected: "rejected",
  paused: "archived",
} as const;

export type AdminProductTab = keyof typeof ADMIN_PRODUCT_TAB_STATUS;

export async function listAdminProducts(
  actor: Actor,
  options?: {
    status?: AdminProductTab;
    q?: string;
    categoryId?: string;
    sellerId?: string;
    page?: number;
    pageSize?: number;
  },
) {
  if (!actorIsAdmin(actor)) {
    throw new AuthorizationError("Administrator role required");
  }

  const tab: AdminProductTab = options?.status ?? "pending";
  const status = ADMIN_PRODUCT_TAB_STATUS[tab];
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, options?.pageSize ?? 20));
  const q = options?.q?.trim();

  const filterWhere: Prisma.ProductWhereInput = {
    ...(options?.categoryId ? { categoryId: options.categoryId } : {}),
    ...(options?.sellerId ? { sellerId: options.sellerId } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            {
              variants: {
                some: { sku: { contains: q, mode: "insensitive" } },
              },
            },
            {
              seller: {
                OR: [
                  { legalName: { contains: q, mode: "insensitive" } },
                  { tradeName: { contains: q, mode: "insensitive" } },
                ],
              },
            },
          ],
        }
      : {}),
  };

  const where: Prisma.ProductWhereInput = {
    ...filterWhere,
    status,
  };

  const include = {
    seller: { select: { id: true, legalName: true, tradeName: true } },
    category: true,
    brand: true,
    images: { orderBy: { sortOrder: "asc" as const }, take: 3 },
    variants: { include: { inventory: true } },
  };

  const [total, pending, approved, rejected, paused] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.count({
      where: { ...filterWhere, status: "submitted" },
    }),
    prisma.product.count({
      where: { ...filterWhere, status: "approved" },
    }),
    prisma.product.count({
      where: { ...filterWhere, status: "rejected" },
    }),
    prisma.product.count({
      where: { ...filterWhere, status: "archived" },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const items = await prisma.product.findMany({
    where,
    orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
    skip: (safePage - 1) * pageSize,
    take: pageSize,
    include,
  });

  return {
    items,
    page: safePage,
    pageSize,
    total,
    pageCount,
    counts: { pending, approved, rejected, paused },
  };
}

export async function getPublicProductBySlug(slug: string) {
  await releaseExpiredCheckoutReservations();
  return prisma.product.findFirst({
    where: { slug, status: "approved" },
    include: {
      seller: {
        select: {
          id: true,
          legalName: true,
          tradeName: true,
          status: true,
        },
      },
      category: true,
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: {
        where: { isActive: true },
        include: { inventory: true },
      },
    },
  });
}

type ReviewAggregate = { average: number | null; count: number };

async function reviewAggregatesFor(productIds: string[]) {
  const unique = [...new Set(productIds)];
  if (unique.length === 0) return new Map<string, ReviewAggregate>();
  const grouped = await prisma.productReview.groupBy({
    by: ["productId"],
    where: { status: "approved", productId: { in: unique } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(
    grouped.map((row) => [
      row.productId,
      { average: row._avg.rating, count: row._count._all },
    ]),
  );
}

export async function searchApprovedProducts(
  raw: z.input<typeof searchProductsSchema>,
) {
  await releaseExpiredCheckoutReservations();
  const input = searchProductsSchema.parse(raw);
  const page = input.page;
  const pageSize = input.pageSize;
  const offset = (page - 1) * pageSize;
  const query = input.q?.trim() ?? "";
  const sort = input.sort ?? "newest";

  if (query) {
    const orderSql =
      sort === "price_asc"
        ? Prisma.sql`ORDER BY min_price_paise ASC`
        : sort === "price_desc"
          ? Prisma.sql`ORDER BY min_price_paise DESC`
          : sort === "rating"
            ? Prisma.sql`ORDER BY MAX(rv.rating_avg) DESC NULLS LAST, p.published_at DESC NULLS LAST`
            : sort === "relevance"
              ? Prisma.sql`ORDER BY
                  CASE WHEN p.title ILIKE ${"%" + query + "%"} THEN 2
                       WHEN p.summary ILIKE ${"%" + query + "%"} THEN 1
                       ELSE 0 END DESC,
                  ts_rank(
                    setweight(to_tsvector('english', p.title), 'A') ||
                    setweight(to_tsvector('english', coalesce(p.summary, '')), 'B') ||
                    setweight(to_tsvector('english', coalesce(c.name, '')), 'C'),
                    plainto_tsquery('english', ${query})
                  ) DESC,
                  p.published_at DESC NULLS LAST`
              : Prisma.sql`ORDER BY p.published_at DESC NULLS LAST`;

    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        slug: string;
        title: string;
        summary: string;
        category_name: string;
        seller_name: string;
        seller_status: string;
        min_price_paise: number;
        min_mrp_paise: number;
        available_qty: number;
        total_count: bigint;
        rating_avg: number | null;
        rating_count: number | null;
      }>
    >(Prisma.sql`
      WITH ranked AS (
        SELECT
          p.id,
          p.slug,
          p.title,
          p.summary,
          c.name AS category_name,
          COALESCE(s.trade_name, s.legal_name) AS seller_name,
          s.status::text AS seller_status,
          MIN(v.selling_price_paise) AS min_price_paise,
          MIN(v.mrp_paise) AS min_mrp_paise,
          COALESCE(SUM(GREATEST(i.on_hand - i.reserved, 0)), 0)::int AS available_qty,
          COUNT(*) OVER() AS total_count,
          MAX(rv.rating_avg) AS rating_avg,
          MAX(rv.rating_count) AS rating_count,
          p.published_at,
          p.attributes,
          p.search_document
        FROM products p
        INNER JOIN categories c ON c.id = p.category_id
        INNER JOIN sellers s ON s.id = p.seller_id
        INNER JOIN product_variants v ON v.product_id = p.id AND v.is_active = true
        LEFT JOIN inventory_items i ON i.variant_id = v.id
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN (
          SELECT product_id,
                 AVG(rating)::float8 AS rating_avg,
                 COUNT(*)::int AS rating_count
          FROM product_reviews
          WHERE status = 'approved'
          GROUP BY product_id
        ) rv ON rv.product_id = p.id
        WHERE p.status = 'approved'
          AND (
            -- Match title/summary/category tightly so long descriptions do not
            -- pull unrelated listings (e.g. sandals for "dress").
            to_tsvector(
              'english',
              concat_ws(
                ' ',
                p.title,
                coalesce(p.summary, ''),
                coalesce(c.name, ''),
                coalesce(b.name, '')
              )
            ) @@ plainto_tsquery('english', ${query})
            OR p.title ILIKE ${"%" + query + "%"}
            OR p.summary ILIKE ${"%" + query + "%"}
          )
          ${
            input.categorySlug
              ? Prisma.sql`AND c.slug = ${input.categorySlug}`
              : Prisma.empty
          }
          ${
            input.brandSlug
              ? Prisma.sql`AND b.slug = ${input.brandSlug}`
              : Prisma.empty
          }
          ${
            input.audience
              ? Prisma.sql`AND p.attributes->>'audience' = ${input.audience}`
              : Prisma.empty
          }
          ${
            input.verifiedSellerOnly
              ? Prisma.sql`AND s.status = 'approved'`
              : Prisma.empty
          }
          ${
            input.minPricePaise !== undefined
              ? Prisma.sql`AND v.selling_price_paise >= ${input.minPricePaise}`
              : Prisma.empty
          }
          ${
            input.maxPricePaise !== undefined
              ? Prisma.sql`AND v.selling_price_paise <= ${input.maxPricePaise}`
              : Prisma.empty
          }
          ${
            input.minRating !== undefined
              ? Prisma.sql`AND COALESCE(rv.rating_avg, 0) >= ${input.minRating}`
              : Prisma.empty
          }
        GROUP BY p.id, p.slug, p.title, p.summary, c.name, s.trade_name, s.legal_name, s.status, p.published_at, p.attributes, p.search_document
        ${
          input.inStockOnly || input.minDiscountPercent !== undefined
            ? Prisma.sql`HAVING ${Prisma.join(
                [
                  ...(input.inStockOnly
                    ? [
                        Prisma.sql`COALESCE(SUM(GREATEST(i.on_hand - i.reserved, 0)), 0) > 0`,
                      ]
                    : []),
                  ...(input.minDiscountPercent !== undefined
                    ? [
                        Prisma.sql`(CASE WHEN MIN(v.mrp_paise) > MIN(v.selling_price_paise) THEN ROUND(((MIN(v.mrp_paise) - MIN(v.selling_price_paise))::numeric / NULLIF(MIN(v.mrp_paise), 0)) * 100) ELSE 0 END) >= ${input.minDiscountPercent}`,
                      ]
                    : []),
                ],
                " AND ",
              )}`
            : Prisma.empty
        }
        ${orderSql}
        LIMIT ${pageSize} OFFSET ${offset}
      )
      SELECT * FROM ranked
    `);

    const total = Number(rows[0]?.total_count ?? 0);
    const baseItems = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      categoryName: row.category_name,
      sellerName: row.seller_name,
      sellerVerified: row.seller_status === "approved",
      minPricePaise: row.min_price_paise,
      minMrpPaise: row.min_mrp_paise,
      availableQty: row.available_qty,
      ratingAverage:
        row.rating_count && row.rating_avg != null ? Number(row.rating_avg) : null,
      reviewCount: row.rating_count ?? 0,
    }));
    return {
      items: await enrichStorefrontCards(await attachPrimaryImages(baseItems)),
      page,
      pageSize,
      total,
    };
  }

  const where: Prisma.ProductWhereInput = {
    status: "approved",
    ...(input.categorySlug
      ? { category: { slug: input.categorySlug, isActive: true } }
      : {}),
    ...(input.brandSlug ? { brand: { slug: input.brandSlug } } : {}),
    ...(input.audience
      ? {
          attributes: {
            path: ["audience"],
            equals: input.audience,
          },
        }
      : {}),
    ...(input.verifiedSellerOnly ? { seller: { status: "approved" } } : {}),
    variants: {
      some: {
        isActive: true,
        ...(input.minPricePaise !== undefined || input.maxPricePaise !== undefined
          ? {
              sellingPricePaise: {
                ...(input.minPricePaise !== undefined
                  ? { gte: input.minPricePaise }
                  : {}),
                ...(input.maxPricePaise !== undefined
                  ? { lte: input.maxPricePaise }
                  : {}),
              },
            }
          : {}),
        ...(input.inStockOnly
          ? {
              inventory: {
                is: {
                  // available = onHand - reserved; approximate with onHand > 0
                  onHand: { gt: 0 },
                },
              },
            }
          : {}),
      },
    },
  };

  const needsClientSortOrFilter =
    input.minRating != null ||
    input.minDiscountPercent != null ||
    sort === "price_asc" ||
    sort === "price_desc" ||
    sort === "rating";

  const orderBy: Prisma.ProductOrderByWithRelationInput = {
    publishedAt: "desc",
  };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: needsClientSortOrFilter ? undefined : offset,
      take: needsClientSortOrFilter ? undefined : pageSize,
      include: {
        category: true,
        brand: { select: { slug: true, name: true } },
        seller: { select: { legalName: true, tradeName: true, status: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
          orderBy: { sortOrder: "asc" },
        },
        variants: {
          where: { isActive: true },
          include: { inventory: true },
        },
      },
    }),
  ]);

  let items = products.map((product) => {
    const prices = product.variants.map((variant) => variant.sellingPricePaise);
    const mrps = product.variants.map((variant) => variant.mrpPaise);
    const availableQty = product.variants.reduce((sum, variant) => {
      const onHand = variant.inventory?.onHand ?? 0;
      const reserved = variant.inventory?.reserved ?? 0;
      return sum + Math.max(onHand - reserved, 0);
    }, 0);
    const sellerVerified = product.seller.status === "approved";
    const minPricePaise = Math.min(...prices);
    const minMrpPaise = Math.min(...mrps);
    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      summary: product.summary,
      categoryName: product.category.name,
      sellerName: product.seller.tradeName ?? product.seller.legalName,
      sellerVerified,
      minPricePaise,
      minMrpPaise,
      availableQty,
      ratingAverage: null as number | null,
      reviewCount: 0,
      dealEndsAt: null,
      deliveryFeePaise: null,
      freeDeliveryHint: freeDeliveryHintFromPolicy({
        minPricePaise,
        freeAbovePaise: SHIPPING_POLICY.freeAbovePaise,
      }),
      variantCount: product.variants.length,
      badge: resolveProductBadge({
        brandSlug: product.brand?.slug,
        brandName: product.brand?.name,
        sellerVerified,
        availableQty,
        freeDelivery: freeDeliveryHintFromPolicy({
          minPricePaise,
          freeAbovePaise: SHIPPING_POLICY.freeAbovePaise,
        }),
        discountPercent: discountPercent(minMrpPaise, minPricePaise),
        createdAt: product.createdAt,
      }),
      primaryImageUrl: product.images[0]?.url ?? null,
      primaryImageAlt:
        product.images[0]?.altText ??
        `${product.title} (catalogue preview image)`,
    };
  });

  const reviewAggs = await reviewAggregatesFor(items.map((item) => item.id));
  items = items.map((item) => {
    const aggregate = reviewAggs.get(item.id);
    const storefrontRating = resolveStorefrontRating({
      reviewAggregateAverage: aggregate?.average,
      reviewAggregateCount: aggregate?.count,
    });
    return {
      ...item,
      ratingAverage: storefrontRating?.average ?? null,
      reviewCount: storefrontRating?.count ?? 0,
    };
  });

  if (input.inStockOnly) {
    items = items.filter((item) => item.availableQty > 0);
  }
  if (input.minRating != null) {
    items = items.filter(
      (item) => (item.ratingAverage ?? 0) >= (input.minRating as number),
    );
  }
  if (input.minDiscountPercent != null) {
    items = items.filter((item) => {
      const mrp = item.minMrpPaise ?? 0;
      if (!mrp || mrp <= item.minPricePaise) return false;
      const discount = Math.round(((mrp - item.minPricePaise) / mrp) * 100);
      return discount >= (input.minDiscountPercent as number);
    });
  }
  if (sort === "price_asc") {
    items = [...items].sort((a, b) => a.minPricePaise - b.minPricePaise);
  } else if (sort === "price_desc") {
    items = [...items].sort((a, b) => b.minPricePaise - a.minPricePaise);
  } else if (sort === "rating") {
    items = [...items].sort(
      (a, b) => (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0),
    );
  }
  // When client-side filters shrink the page, still return filtered slice
  let working = items;
  if (needsClientSortOrFilter) {
    working = working.slice(offset, offset + pageSize);
  } else {
    working = working.slice(0, pageSize);
  }
  const filteredTotal = needsClientSortOrFilter ? items.length : total;

  return {
    items: await enrichStorefrontCards(working),
    page,
    pageSize,
    total: filteredTotal,
  };
}

async function enrichStorefrontCards<
  T extends {
    id: string;
    ratingAverage?: number | null;
    reviewCount?: number;
    dealEndsAt?: string | null;
    deliveryFeePaise?: number | null;
    freeDeliveryHint?: boolean;
    variantCount?: number;
    badge?: ProductCardBadge | null;
    sellerVerified?: boolean;
    availableQty?: number;
    minPricePaise?: number;
    minMrpPaise?: number | null;
  },
>(items: T[]) {
  if (items.length === 0) return items;
  const needsMeta = items.some(
    (item) => item.variantCount == null || item.badge === undefined,
  );
  const missingRatings = items.filter(
    (item) => item.ratingAverage == null || (item.reviewCount ?? 0) <= 0,
  );
  if (!needsMeta && missingRatings.length === 0) return items;
  const [products, reviewAggs] = await Promise.all([
    needsMeta
      ? prisma.product.findMany({
          where: { id: { in: items.map((item) => item.id) } },
          select: {
            id: true,
            createdAt: true,
            brand: { select: { slug: true, name: true } },
            seller: { select: { status: true } },
            _count: { select: { variants: { where: { isActive: true } } } },
          },
        })
      : Promise.resolve([]),
    reviewAggregatesFor(missingRatings.map((item) => item.id)),
  ]);
  const byId = new Map(products.map((product) => [product.id, product]));
  return items.map((item) => {
    const product = byId.get(item.id);
    const sellerVerified =
      item.sellerVerified ?? product?.seller.status === "approved";
    const freeDelivery = freeDeliveryHintFromPolicy({
      minPricePaise: item.minPricePaise ?? 0,
      freeAbovePaise: SHIPPING_POLICY.freeAbovePaise,
    });
    const disc =
      item.minMrpPaise != null && item.minPricePaise != null
        ? discountPercent(item.minMrpPaise, item.minPricePaise)
        : null;
    const aggregate = reviewAggs.get(item.id);
    const storefrontRating =
      item.ratingAverage != null && (item.reviewCount ?? 0) > 0
        ? { average: item.ratingAverage, count: item.reviewCount ?? 0 }
        : resolveStorefrontRating({
            reviewAggregateAverage: aggregate?.average,
            reviewAggregateCount: aggregate?.count,
          });
    return {
      ...item,
      ratingAverage: storefrontRating?.average ?? null,
      reviewCount: storefrontRating?.count ?? 0,
      dealEndsAt: null,
      deliveryFeePaise: null,
      freeDeliveryHint: item.freeDeliveryHint ?? freeDelivery,
      deliveryOriginalPaise: null,
      variantCount: item.variantCount ?? product?._count.variants ?? 1,
      badge:
        item.badge !== undefined
          ? item.badge
          : resolveProductBadge({
              brandSlug: product?.brand?.slug,
              brandName: product?.brand?.name,
              sellerVerified,
              availableQty: item.availableQty,
              freeDelivery,
              discountPercent: disc,
              createdAt: product?.createdAt,
            }),
    };
  });
}

async function attachPrimaryImages<
  T extends { id: string; title: string },
>(items: T[]) {
  if (items.length === 0) {
    return items.map((item) => ({
      ...item,
      primaryImageUrl: null as string | null,
      primaryImageAlt: item.title,
    }));
  }
  const images = await prisma.productImage.findMany({
    where: {
      productId: { in: items.map((item) => item.id) },
      isPrimary: true,
    },
    orderBy: { sortOrder: "asc" },
  });
  const byProduct = new Map(images.map((image) => [image.productId, image]));
  return items.map((item) => {
    const image = byProduct.get(item.id);
    return {
      ...item,
      primaryImageUrl: image?.url ?? null,
      primaryImageAlt: image?.altText ?? item.title,
    };
  });
}

export class CatalogueValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "CatalogueValidationError";
  }
}

export class CatalogueConflictError extends Error {
  readonly code = "CONFLICT";
  constructor(message: string) {
    super(message);
    this.name = "CatalogueConflictError";
  }
}
