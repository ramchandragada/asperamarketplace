import type { PrismaClient, ProductStatus } from "@prisma/client";
import { buildSearchDocument } from "./helpers";
import {
  imagesForProduct,
  SEED_BRANDS,
  SEED_CATEGORIES,
  SEED_PRODUCTS,
} from "./seed-catalogue-data";

export type SeedSellerMap = Record<
  "home" | "fashion" | "tech" | "wellness",
  { id: string }
>;

export async function seedMarketplaceCatalogue(
  prisma: PrismaClient,
  input: {
    sellers: SeedSellerMap;
    adminUserId: string;
  },
) {
  for (const category of SEED_CATEGORIES) {
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

  const brandIds: Record<string, string> = {};
  for (const brand of SEED_BRANDS) {
    const row = await prisma.brand.upsert({
      where: { slug: brand.slug },
      create: { slug: brand.slug, name: brand.name },
      update: { name: brand.name },
    });
    brandIds[brand.slug] = row.id;
  }

  const categoryRows = await prisma.category.findMany({
    where: { slug: { in: SEED_CATEGORIES.map((entry) => entry.slug) } },
  });
  const categoryIds = Object.fromEntries(
    categoryRows.map((row) => [row.slug, row.id]),
  );

  let created = 0;
  let updated = 0;
  const perCategory: Record<string, number> = {};

  for (const [index, item] of SEED_PRODUCTS.entries()) {
    const seller = input.sellers[item.sellerKey];
    const categoryId = categoryIds[item.categorySlug];
    const brandId = brandIds[item.brandSlug];
    if (!seller || !categoryId || !brandId) {
      throw new Error(`Missing refs for ${item.slug}`);
    }

    const status: ProductStatus = item.status ?? "approved";
    const searchDocument = buildSearchDocument({
      title: item.title,
      summary: item.summary,
      description: item.description,
      brandName: SEED_BRANDS.find((brand) => brand.slug === item.brandSlug)?.name,
      categoryName: SEED_CATEGORIES.find((category) => category.slug === item.categorySlug)
        ?.name,
      sku: item.sku,
    });

    const existing = await prisma.product.findUnique({
      where: { slug: item.slug },
      include: { variants: true, images: true },
    });

    if (!existing) {
      await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            sellerId: seller.id,
            categoryId,
            brandId,
            slug: item.slug,
            title: item.title,
            summary: item.summary,
            description: item.description,
            status,
            countryOfOrigin: "India",
            hsnCode: item.hsnCode,
            searchDocument,
            submittedAt: new Date(),
            reviewedAt: status === "approved" ? new Date() : null,
            reviewedByUserId: status === "approved" ? input.adminUserId : null,
            publishedAt: status === "approved" ? new Date() : null,
            statusReason:
              status === "approved"
                ? "Seeded approved listing for development/preview catalogue"
                : `Seed ${status} listing for workflow testing`,
          },
        });
        const variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: item.sku,
            title: "Standard",
            mrpPaise: item.mrpPaise,
            sellingPricePaise: item.sellingPricePaise,
            weightGrams: item.weightGrams,
          },
        });
        const inventory = await tx.inventoryItem.create({
          data: {
            variantId: variant.id,
            sellerId: seller.id,
            onHand: item.onHand,
            reserved: 0,
            damaged: 0,
          },
        });
        if (item.onHand > 0) {
          await tx.stockMovement.create({
            data: {
              inventoryItemId: inventory.id,
              movementType: "receive",
              quantity: item.onHand,
              reason: "Seed initial stock",
              actorId: input.adminUserId,
              correlationId: `seed-${item.sku}`,
            },
          });
        }
        for (const image of imagesForProduct(
          item.categorySlug,
          item.title,
          index,
        )) {
          await tx.productImage.create({
            data: {
              productId: product.id,
              url: image.url,
              altText: image.altText,
              sortOrder: image.sortOrder,
              isPrimary: image.isPrimary,
            },
          });
        }
      });
      created += 1;
    } else {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          title: item.title,
          summary: item.summary,
          description: item.description,
          categoryId,
          brandId,
          sellerId: seller.id,
          searchDocument,
          hsnCode: item.hsnCode,
          status,
          publishedAt:
            status === "approved"
              ? (existing.publishedAt ?? new Date())
              : null,
        },
      });
      const variant = existing.variants[0];
      if (variant) {
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: {
            mrpPaise: item.mrpPaise,
            sellingPricePaise: item.sellingPricePaise,
            weightGrams: item.weightGrams,
            sku: item.sku,
          },
        });
        await prisma.inventoryItem.updateMany({
          where: { variantId: variant.id },
          data: { onHand: item.onHand, sellerId: seller.id },
        });
      }
      if (existing.images.length === 0) {
        for (const image of imagesForProduct(
          item.categorySlug,
          item.title,
          index,
        )) {
          await prisma.productImage.create({
            data: {
              productId: existing.id,
              url: image.url,
              altText: image.altText,
              sortOrder: image.sortOrder,
              isPrimary: image.isPrimary,
            },
          });
        }
      }
      updated += 1;
    }

    perCategory[item.categorySlug] = (perCategory[item.categorySlug] ?? 0) + 1;
  }

  return {
    categories: SEED_CATEGORIES.length,
    productsDefined: SEED_PRODUCTS.length,
    created,
    updated,
    perCategory,
  };
}
