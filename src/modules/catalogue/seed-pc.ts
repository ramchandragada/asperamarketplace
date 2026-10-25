/**
 * Reseed the catalogue as a Pune PC-components marketplace.
 *
 * - Upserts the 9 PC categories + brands from pc-catalogue-data.
 * - Ensures the Pune computer-shop sellers (approved).
 * - Archives every existing non-PC product (hidden from the storefront;
 *   no hard delete, so orders/cart references stay intact) and deactivates
 *   the old categories.
 * - Upserts the 90 PC products (one "Standard" variant + inventory + image).
 *
 * Idempotent — safe to run repeatedly.
 */
import type { Prisma, PrismaClient } from "@prisma/client";
import { hashPassword } from "@/modules/identity/crypto";
import { buildSearchDocument } from "@/modules/catalogue/helpers";
import {
  PC_BRANDS,
  PC_CATEGORIES,
  PC_PRODUCTS,
  PC_SELLERS,
} from "@/modules/catalogue/pc-catalogue-data";
import {
  enrichProduct,
  toEnrichmentAttributes,
} from "@/modules/catalogue/product-enrichment";

const SELLER_PASSWORD = "AsperaSellerDevOnly1!";

export type SeedPcResult = {
  categories: number;
  brands: number;
  sellers: number;
  products: number;
  archivedOld: number;
};

export async function seedPcCatalogue(
  prisma: PrismaClient,
): Promise<SeedPcResult> {
  const pcCategorySlugs = PC_CATEGORIES.map((c) => c.slug);
  const pcProductSlugs = PC_PRODUCTS.map((p) => p.slug);

  // Roles + admin reviewer.
  const sellerRole = await prisma.role.findUniqueOrThrow({
    where: { key: "seller_owner" },
  });
  const adminUser = await prisma.user.findFirst({
    where: { roles: { some: { role: { key: "admin" } } } },
    select: { id: true },
  });
  const reviewerId = adminUser?.id ?? null;

  // Categories.
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
  // Retire old (non-PC) categories from the storefront.
  await prisma.category.updateMany({
    where: { slug: { notIn: pcCategorySlugs } },
    data: { isActive: false },
  });

  // Brands.
  const brandId: Record<string, string> = {};
  for (const brand of PC_BRANDS) {
    const row = await prisma.brand.upsert({
      where: { slug: brand.slug },
      create: { slug: brand.slug, name: brand.name },
      update: { name: brand.name },
    });
    brandId[brand.slug] = row.id;
  }

  // Pune sellers.
  const sellerId: Record<string, string> = {};
  for (const seller of PC_SELLERS) {
    const email = `${seller.key}@aspera.local`;
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        displayName: seller.tradeName,
        passwordHash: await hashPassword(SELLER_PASSWORD),
        emailVerifiedAt: new Date(),
      },
      update: {},
    });
    await prisma.userRole.upsert({
      where: {
        userId_roleId_scopeKey: {
          userId: user.id,
          roleId: sellerRole.id,
          scopeKey: "global",
        },
      },
      create: { userId: user.id, roleId: sellerRole.id, scopeKey: "global" },
      update: {},
    });
    let row = await prisma.seller.findFirst({
      where: { ownerUserId: user.id },
    });
    if (!row) {
      row = await prisma.seller.create({
        data: {
          ownerUserId: user.id,
          legalName: seller.legalName,
          tradeName: seller.tradeName,
          status: "approved",
          contactEmail: email,
          registeredState: "Maharashtra",
          approvedAt: new Date(),
          submittedAt: new Date(),
          reviewedAt: new Date(),
          reviewedByUserId: reviewerId,
          agreementAcceptedAt: new Date(),
        },
      });
    } else {
      row = await prisma.seller.update({
        where: { id: row.id },
        data: {
          legalName: seller.legalName,
          tradeName: seller.tradeName,
          status: "approved",
        },
      });
    }
    sellerId[seller.key] = row.id;
  }

  // Archive existing non-PC products so only PC parts show.
  const archived = await prisma.product.updateMany({
    where: { slug: { notIn: pcProductSlugs } },
    data: { status: "archived" },
  });

  const brandName = Object.fromEntries(PC_BRANDS.map((b) => [b.slug, b.name]));
  const categoryName = Object.fromEntries(
    PC_CATEGORIES.map((c) => [c.slug, c.name]),
  );

  // PC products.
  for (const item of PC_PRODUCTS) {
    const seller = sellerId[item.sellerKey];
    const categoryRow = await prisma.category.findUnique({
      where: { slug: item.categorySlug },
      select: { id: true },
    });
    const brand = brandId[item.brandSlug];
    if (!seller || !categoryRow || !brand) {
      throw new Error(
        `Missing refs for ${item.slug} (seller/${item.sellerKey} cat/${item.categorySlug} brand/${item.brandSlug})`,
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

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      create: {
        sellerId: seller,
        categoryId: categoryRow.id,
        brandId: brand,
        slug: item.slug,
        title: item.title,
        summary,
        description,
        status: "approved",
        countryOfOrigin: "India",
        hsnCode: item.hsnCode,
        searchDocument,
        attributes,
        submittedAt: new Date(),
        reviewedAt: new Date(),
        reviewedByUserId: reviewerId,
        publishedAt: new Date(),
      },
      update: {
        sellerId: seller,
        categoryId: categoryRow.id,
        brandId: brand,
        title: item.title,
        summary,
        description,
        status: "approved",
        hsnCode: item.hsnCode,
        searchDocument,
        attributes,
        publishedAt: new Date(),
      },
    });

    // Single "Standard" variant + inventory.
    const variant = await prisma.productVariant.upsert({
      where: { sku: item.sku },
      create: {
        productId: product.id,
        sku: item.sku,
        title: "Standard",
        mrpPaise: item.mrpPaise,
        sellingPricePaise: item.sellingPricePaise,
      },
      update: {
        productId: product.id,
        title: "Standard",
        mrpPaise: item.mrpPaise,
        sellingPricePaise: item.sellingPricePaise,
      },
    });
    const inv = await prisma.inventoryItem.findUnique({
      where: { variantId: variant.id },
    });
    if (!inv) {
      await prisma.inventoryItem.create({
        data: { variantId: variant.id, sellerId: seller, onHand: item.onHand },
      });
    } else {
      await prisma.inventoryItem.update({
        where: { variantId: variant.id },
        data: { onHand: item.onHand },
      });
    }

    // One product image (if the asset exists).
    if (item.imagePath) {
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      await prisma.productImage.create({
        data: {
          productId: product.id,
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
    sellers: PC_SELLERS.length,
    products: PC_PRODUCTS.length,
    archivedOld: archived.count,
  };
}
