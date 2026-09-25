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
  searchProductsSchema,
  type CreateProductInput,
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
      images: { orderBy: { sortOrder: "asc" } },
      variants: {
        where: { isActive: true },
        include: { inventory: true },
      },
    },
  });
}

export async function searchApprovedProducts(
  raw: z.input<typeof searchProductsSchema>,
) {
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
            ? Prisma.sql`ORDER BY COALESCE((p.attributes->>'ratingAverage')::float, 0) DESC, p.published_at DESC NULLS LAST`
            : sort === "relevance"
              ? Prisma.sql`ORDER BY ts_rank(to_tsvector('english', p.search_document), plainto_tsquery('english', ${query})) DESC, p.published_at DESC NULLS LAST`
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
          p.published_at,
          p.attributes,
          p.search_document
        FROM products p
        INNER JOIN categories c ON c.id = p.category_id
        INNER JOIN sellers s ON s.id = p.seller_id
        INNER JOIN product_variants v ON v.product_id = p.id AND v.is_active = true
        LEFT JOIN inventory_items i ON i.variant_id = v.id
        LEFT JOIN brands b ON b.id = p.brand_id
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
            input.brandSlug
              ? Prisma.sql`AND b.slug = ${input.brandSlug}`
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
        GROUP BY p.id, p.slug, p.title, p.summary, c.name, s.trade_name, s.legal_name, s.status, p.published_at, p.attributes, p.search_document
        ${input.inStockOnly ? Prisma.sql`HAVING COALESCE(SUM(GREATEST(i.on_hand - i.reserved, 0)), 0) > 0` : Prisma.empty}
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
      skip: needsClientSortOrFilter ? 0 : offset,
      take: needsClientSortOrFilter
        ? Math.min(200, pageSize * 8)
        : pageSize,
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
    const attrs =
      product.attributes &&
      typeof product.attributes === "object" &&
      !Array.isArray(product.attributes)
        ? (product.attributes as Record<string, unknown>)
        : {};
    const ratingAverage =
      typeof attrs.ratingAverage === "number" ? attrs.ratingAverage : null;
    const reviewCount =
      typeof attrs.reviewCount === "number" ? attrs.reviewCount : 0;
    const dealEndsAt =
      typeof attrs.dealEndsAt === "string" ? attrs.dealEndsAt : null;
    const deliveryFeePaise =
      typeof attrs.deliveryFeePaise === "number" ? attrs.deliveryFeePaise : null;
    const sellerVerified = product.seller.status === "approved";
    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      summary: product.summary,
      categoryName: product.category.name,
      sellerName: product.seller.tradeName ?? product.seller.legalName,
      sellerVerified,
      minPricePaise: Math.min(...prices),
      minMrpPaise: Math.min(...mrps),
      availableQty,
      ratingAverage,
      reviewCount,
      dealEndsAt,
      deliveryFeePaise,
      freeDeliveryHint: deliveryFeePaise === 0,
      variantCount: product.variants.length,
      badge: resolveProductBadge({
        brandSlug: product.brand?.slug,
        brandName: product.brand?.name,
        sellerVerified,
        availableQty,
        freeDelivery: deliveryFeePaise === 0,
        discountPercent: discountPercent(
          Math.min(...mrps),
          Math.min(...prices),
        ),
        createdAt: product.createdAt,
      }),
      primaryImageUrl: product.images[0]?.url ?? null,
      primaryImageAlt: product.images[0]?.altText ?? product.title,
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
    (item) =>
      item.variantCount == null ||
      item.badge === undefined ||
      item.ratingAverage == null,
  );
  if (!needsMeta) return items;
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((item) => item.id) } },
    select: {
      id: true,
      createdAt: true,
      attributes: true,
      brand: { select: { slug: true, name: true } },
      seller: { select: { status: true } },
      _count: { select: { variants: { where: { isActive: true } } } },
    },
  });
  const byId = new Map(products.map((product) => [product.id, product]));
  return items.map((item) => {
    const product = byId.get(item.id);
    const raw = product?.attributes;
    const attrs =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {};
    const sellerVerified =
      item.sellerVerified ?? product?.seller.status === "approved";
    const freeDelivery =
      item.freeDeliveryHint === true ||
      (typeof attrs.deliveryFeePaise === "number" &&
        attrs.deliveryFeePaise === 0);
    const disc =
      item.minMrpPaise != null && item.minPricePaise != null
        ? discountPercent(item.minMrpPaise, item.minPricePaise)
        : null;
    return {
      ...item,
      ratingAverage:
        item.ratingAverage ??
        (typeof attrs.ratingAverage === "number" ? attrs.ratingAverage : null),
      reviewCount:
        item.reviewCount ??
        (typeof attrs.reviewCount === "number" ? attrs.reviewCount : 0),
      dealEndsAt:
        item.dealEndsAt ??
        (typeof attrs.dealEndsAt === "string" ? attrs.dealEndsAt : null),
      deliveryFeePaise:
        item.deliveryFeePaise ??
        (typeof attrs.deliveryFeePaise === "number"
          ? attrs.deliveryFeePaise
          : null),
      freeDeliveryHint:
        item.freeDeliveryHint ??
        (typeof attrs.deliveryFeePaise === "number"
          ? attrs.deliveryFeePaise === 0
          : undefined),
      deliveryOriginalPaise:
        typeof attrs.deliveryOriginalPaise === "number"
          ? attrs.deliveryOriginalPaise
          : typeof attrs.deliveryFeePaise === "number" &&
              attrs.deliveryFeePaise > 0
            ? Math.round((attrs.deliveryFeePaise as number) * 1.15)
            : null,
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
