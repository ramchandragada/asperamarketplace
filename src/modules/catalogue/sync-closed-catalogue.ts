/**
 * Publish the full PC seed catalogue as closed-catalogue shells under the
 * Aspera Catalogue owner so sellers can pick Category → … → SKU.
 *
 * Idempotent. Safe to re-run. Does not invent products outside PC_PRODUCTS.
 */
import crypto from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { buildSearchDocument } from "@/modules/catalogue/helpers";
import {
  PC_BRANDS,
  PC_CATEGORIES,
  PC_PRODUCTS,
} from "@/modules/catalogue/pc-catalogue-data";
import {
  enrichProduct,
  toEnrichmentAttributes,
} from "@/modules/catalogue/product-enrichment";
import { asperaLegal } from "@/platform/config/aspera-legal";

/** Keep in sync with service.CATALOGUE_OWNER_TRADE_NAME */
const CATALOGUE_OWNER_TRADE_NAME = "Aspera Catalogue";

export type SyncClosedCatalogueResult = {
  categories: number;
  brands: number;
  ownerSellerId: string;
  created: number;
  updated: number;
  approved: number;
  skippedLiveDealer: number;
  totalSeed: number;
};

function sharedListingKeyForSlug(slug: string): string {
  const digest = crypto.createHash("sha256").update(slug).digest("hex").slice(0, 16);
  return `listing-${digest}`;
}

async function ensureCatalogueOwner(
  prisma: PrismaClient,
): Promise<{ id: string; ownerUserId: string }> {
  const admin =
    (await prisma.user.findFirst({
      where: { roles: { some: { role: { key: "admin" } } } },
      select: { id: true },
    })) ??
    (await prisma.user.findFirst({
      where: { email: "admin@aspera.local" },
      select: { id: true },
    }));
  if (!admin) {
    throw new Error(
      "No admin user found — create admin@aspera.local before syncing catalogue",
    );
  }

  const existing = await prisma.seller.findFirst({
    where: {
      OR: [
        { gstin: asperaLegal.gstinRegular, tradeName: CATALOGUE_OWNER_TRADE_NAME },
        { tradeName: CATALOGUE_OWNER_TRADE_NAME },
        { gstin: asperaLegal.gstinRegular },
      ],
    },
  });

  if (existing) {
    return prisma.seller.update({
      where: { id: existing.id },
      data: {
        ownerUserId: existing.ownerUserId || admin.id,
        legalName: asperaLegal.legalEntity,
        tradeName: CATALOGUE_OWNER_TRADE_NAME,
        status: "approved",
        statusReason: "Platform catalogue owner",
        contactEmail: asperaLegal.supportEmail.toLowerCase(),
        gstin: asperaLegal.gstinRegular,
        gstinMasked: `${asperaLegal.gstinRegular.slice(0, 2)}****${asperaLegal.gstinRegular.slice(-3)}`,
        panLast4: asperaLegal.pan.slice(-4),
        registeredState: asperaLegal.state,
        pickupCity: asperaLegal.tcsPpob.city,
        pickupLine1: asperaLegal.tcsPpob.lines[0],
        pickupPostalCode: asperaLegal.tcsPpob.pincode,
        fulfilmentBy: "aspera_warehouse",
        approvedAt: existing.approvedAt ?? new Date(),
        agreementAcceptedAt: existing.agreementAcceptedAt ?? new Date(),
      },
      select: { id: true, ownerUserId: true },
    });
  }

  return prisma.seller.create({
    data: {
      ownerUserId: admin.id,
      legalName: asperaLegal.legalEntity,
      tradeName: CATALOGUE_OWNER_TRADE_NAME,
      status: "approved",
      statusReason: "Platform catalogue owner",
      contactEmail: asperaLegal.supportEmail.toLowerCase(),
      contactPhone: asperaLegal.supportPhoneDisplay.replace(/\s+/g, ""),
      panLast4: asperaLegal.pan.slice(-4),
      gstin: asperaLegal.gstinRegular,
      gstinMasked: `${asperaLegal.gstinRegular.slice(0, 2)}****${asperaLegal.gstinRegular.slice(-3)}`,
      registeredState: asperaLegal.state,
      pickupCity: asperaLegal.tcsPpob.city,
      pickupLine1: asperaLegal.tcsPpob.lines[0],
      pickupPostalCode: asperaLegal.tcsPpob.pincode,
      fulfilmentBy: "aspera_warehouse",
      approvedAt: new Date(),
      agreementAcceptedAt: new Date(),
    },
    select: { id: true, ownerUserId: true },
  });
}

export async function syncClosedCatalogue(
  prisma: PrismaClient,
): Promise<SyncClosedCatalogueResult> {
  for (const category of PC_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        slug: category.slug,
        name: category.name,
        description: category.description,
        isActive: true,
      },
      update: {
        name: category.name,
        description: category.description,
        isActive: true,
      },
    });
  }

  const brandId: Record<string, string> = {};
  for (const brand of PC_BRANDS) {
    const row = await prisma.brand.upsert({
      where: { slug: brand.slug },
      create: { slug: brand.slug, name: brand.name },
      update: { name: brand.name },
    });
    brandId[brand.slug] = row.id;
  }

  const owner = await ensureCatalogueOwner(prisma);
  const brandName = Object.fromEntries(PC_BRANDS.map((b) => [b.slug, b.name]));
  const categoryName = Object.fromEntries(
    PC_CATEGORIES.map((c) => [c.slug, c.name]),
  );

  let created = 0;
  let updated = 0;
  let approved = 0;
  let skippedLiveDealer = 0;
  const now = new Date();

  for (const item of PC_PRODUCTS) {
    const categoryRow = await prisma.category.findUnique({
      where: { slug: item.categorySlug },
      select: { id: true },
    });
    const brand = brandId[item.brandSlug];
    if (!categoryRow || !brand) {
      throw new Error(
        `Missing refs for ${item.slug} (cat/${item.categorySlug} brand/${item.brandSlug})`,
      );
    }

    const enrichment = enrichProduct({
      slug: item.slug,
      title: item.title,
      categorySlug: item.categorySlug,
      brandSlug: item.brandSlug,
      brandName: brandName[item.brandSlug],
      categoryName: categoryName[item.categorySlug],
    });
    const summary = enrichment.summary;
    const description = enrichment.description;
    const searchDocument = buildSearchDocument({
      title: item.title,
      summary,
      description,
      brandName: brandName[item.brandSlug],
      categoryName: categoryName[item.categorySlug],
      sku: item.sku,
    });
    const attributes = toEnrichmentAttributes(
      {
        slug: item.slug,
        title: item.title,
        categorySlug: item.categorySlug,
        brandSlug: item.brandSlug,
        brandName: brandName[item.brandSlug],
        categoryName: categoryName[item.categorySlug],
      },
      enrichment,
    ) as Prisma.InputJsonValue;
    const existing = await prisma.product.findUnique({
      where: { slug: item.slug },
      include: {
        seller: {
          select: {
            id: true,
            tradeName: true,
            status: true,
            contactEmail: true,
            gstin: true,
          },
        },
        variants: { select: { id: true, sku: true }, take: 5 },
      },
    });

    const sharedListingKey =
      existing?.sharedListingKey ?? sharedListingKeyForSlug(item.slug);

    const seedOrShellSeller =
      !existing ||
      existing.sellerId === owner.id ||
      existing.seller.tradeName === CATALOGUE_OWNER_TRADE_NAME ||
      (existing.seller.contactEmail?.endsWith("@aspera.local") ?? false) ||
      !existing.seller.gstin ||
      existing.seller.status !== "approved" ||
      existing.status !== "approved";

    if (existing && !seedOrShellSeller) {
      // Real dealer already live on this slug — keep ownership, ensure pickable key.
      if (!existing.sharedListingKey) {
        await prisma.product.update({
          where: { id: existing.id },
          data: { sharedListingKey },
        });
      }
      skippedLiveDealer += 1;
      if (existing.status === "approved") approved += 1;
      continue;
    }

    let resolvedListingKey = sharedListingKey;
    const conflicting = await prisma.product.findFirst({
      where: {
        sharedListingKey: resolvedListingKey,
        sellerId: owner.id,
        ...(existing ? { id: { not: existing.id } } : {}),
      },
      select: { id: true },
    });
    if (conflicting) {
      resolvedListingKey = sharedListingKeyForSlug(
        `${item.slug}:${existing?.id ?? crypto.randomUUID()}`,
      );
    }

    const productData = {
      sellerId: owner.id,
      categoryId: categoryRow.id,
      brandId: brand,
      title: item.title,
      summary,
      description,
      status: "approved" as const,
      statusReason: "Closed catalogue shell",
      countryOfOrigin: "India",
      hsnCode: item.hsnCode,
      searchDocument,
      attributes,
      sharedListingKey: resolvedListingKey,
      submittedAt: now,
      reviewedAt: now,
      reviewedByUserId: owner.ownerUserId,
      publishedAt: now,
    };

    let productId: string;
    if (existing) {
      const product = await prisma.product.update({
        where: { id: existing.id },
        data: productData,
      });
      productId = product.id;
      updated += 1;
    } else {
      const product = await prisma.product.create({
        data: {
          ...productData,
          slug: item.slug,
        },
      });
      productId = product.id;
      created += 1;
    }
    approved += 1;

    // Variant SKU may already exist on this or another product.
    const bySku = await prisma.productVariant.findUnique({
      where: { sku: item.sku },
      include: { inventory: true },
    });
    let variantId: string;
    if (bySku) {
      await prisma.productVariant.update({
        where: { id: bySku.id },
        data: {
          productId,
          title: "Standard",
          mrpPaise: item.mrpPaise,
          sellingPricePaise: item.sellingPricePaise,
          weightGrams: item.weightGrams,
          isActive: true,
        },
      });
      variantId = bySku.id;
      if (bySku.inventory) {
        await prisma.inventoryItem.update({
          where: { id: bySku.inventory.id },
          data: { sellerId: owner.id, onHand: 0 },
        });
      } else {
        await prisma.inventoryItem.create({
          data: {
            variantId,
            sellerId: owner.id,
            onHand: 0,
            reserved: 0,
            damaged: 0,
          },
        });
      }
    } else {
      const variant = await prisma.productVariant.create({
        data: {
          productId,
          sku: item.sku,
          title: "Standard",
          mrpPaise: item.mrpPaise,
          sellingPricePaise: item.sellingPricePaise,
          weightGrams: item.weightGrams,
          inventory: {
            create: {
              sellerId: owner.id,
              onHand: 0,
              reserved: 0,
              damaged: 0,
            },
          },
        },
      });
      variantId = variant.id;
    }
    void variantId;

    if (item.imagePath) {
      await prisma.productImage.deleteMany({ where: { productId } });
      await prisma.productImage.create({
        data: {
          productId,
          url: item.imagePath,
          altText: item.title,
          sortOrder: 0,
          isPrimary: true,
        },
      });
    }
  }

  return {
    categories: PC_CATEGORIES.length,
    brands: PC_BRANDS.length,
    ownerSellerId: owner.id,
    created,
    updated,
    approved,
    skippedLiveDealer,
    totalSeed: PC_PRODUCTS.length,
  };
}
