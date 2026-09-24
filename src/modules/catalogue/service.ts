import { Prisma } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import {
  AuthorizationError,
  actorIsAdmin,
  type Actor,
} from "@/modules/identity/policy";
import {
  assertProductTransition,
  buildSearchDocument,
  slugify,
} from "@/modules/catalogue/helpers";
import type {
  CreateProductInput,
  ReviewProductInput,
  SearchProductsInput,
  SubmitProductInput,
} from "@/modules/catalogue/schema";

async function requireApprovedSellerOwnership(actor: Actor, sellerId: string) {
  const seller = await prisma.seller.findUniqueOrThrow({
    where: { id: sellerId },
  });
  if (seller.ownerUserId !== actor.userId && !actorIsAdmin(actor)) {
    throw new AuthorizationError("Only the seller owner can manage this catalogue");
  }
  if (seller.status !== "approved") {
    throw new AuthorizationError("Only approved sellers can manage listings");
  }
  return seller;
}

export async function listActiveCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
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

export async function listSellerProducts(actor: Actor, sellerId: string) {
  await requireApprovedSellerOwnership(actor, sellerId);
  return prisma.product.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      brand: true,
      variants: { include: { inventory: true } },
    },
  });
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

export async function getPublicProductBySlug(slug: string) {
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
      variants: {
        where: { isActive: true },
        include: { inventory: true },
      },
    },
  });
}

export async function searchApprovedProducts(input: SearchProductsInput) {
  const page = input.page;
  const pageSize = input.pageSize;
  const offset = (page - 1) * pageSize;
  const query = input.q?.trim() ?? "";

  if (query) {
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        slug: string;
        title: string;
        summary: string;
        category_name: string;
        seller_name: string;
        min_price_paise: number;
        available_qty: number;
        total_count: bigint;
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
          MIN(v.selling_price_paise) AS min_price_paise,
          COALESCE(SUM(GREATEST(i.on_hand - i.reserved, 0)), 0)::int AS available_qty,
          COUNT(*) OVER() AS total_count
        FROM products p
        INNER JOIN categories c ON c.id = p.category_id
        INNER JOIN sellers s ON s.id = p.seller_id
        INNER JOIN product_variants v ON v.product_id = p.id AND v.is_active = true
        LEFT JOIN inventory_items i ON i.variant_id = v.id
        WHERE p.status = 'approved'
          AND (
            to_tsvector('english', p.search_document) @@ plainto_tsquery('english', ${query})
            OR p.title ILIKE ${"%" + query + "%"}
          )
          ${
            input.categorySlug
              ? Prisma.sql`AND c.slug = ${input.categorySlug}`
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
        GROUP BY p.id, p.slug, p.title, p.summary, c.name, s.trade_name, s.legal_name, p.published_at
        ORDER BY p.published_at DESC NULLS LAST
        LIMIT ${pageSize} OFFSET ${offset}
      )
      SELECT * FROM ranked
    `);

    const total = Number(rows[0]?.total_count ?? 0);
    return {
      items: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        summary: row.summary,
        categoryName: row.category_name,
        sellerName: row.seller_name,
        minPricePaise: row.min_price_paise,
        availableQty: row.available_qty,
      })),
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
      },
    },
  };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: offset,
      take: pageSize,
      include: {
        category: true,
        seller: { select: { legalName: true, tradeName: true } },
        variants: {
          where: { isActive: true },
          include: { inventory: true },
        },
      },
    }),
  ]);

  return {
    items: products.map((product) => {
      const prices = product.variants.map((variant) => variant.sellingPricePaise);
      const availableQty = product.variants.reduce((sum, variant) => {
        const onHand = variant.inventory?.onHand ?? 0;
        const reserved = variant.inventory?.reserved ?? 0;
        return sum + Math.max(onHand - reserved, 0);
      }, 0);
      return {
        id: product.id,
        slug: product.slug,
        title: product.title,
        summary: product.summary,
        categoryName: product.category.name,
        sellerName: product.seller.tradeName ?? product.seller.legalName,
        minPricePaise: Math.min(...prices),
        availableQty,
      };
    }),
    page,
    pageSize,
    total,
  };
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
