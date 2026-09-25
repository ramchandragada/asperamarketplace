import type { PrismaClient, ProductStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
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

function storefrontAttributes(item: (typeof SEED_PRODUCTS)[number], index: number) {
  const ratingAverage = Number((3.4 + ((index * 7) % 14) * 0.1).toFixed(1));
  const reviewCount = 12 + ((index * 97) % 4800);
  const dealEndsAt =
    index % 5 === 0
      ? new Date(Date.now() + (18 + (index % 30)) * 60 * 60 * 1000).toISOString()
      : undefined;
  const deliveryFeePaise = index % 3 === 0 ? 0 : 6000;
  const highlights: Record<string, string> = {
    Origin: "India",
  };
  if (item.categorySlug === "fashion") {
    highlights.Material = "Cotton blend";
    highlights.Occasion = "Casual";
    highlights.Fit = "Regular";
  } else if (item.categorySlug.includes("beauty")) {
    highlights.Type = "Personal care";
    highlights.Skin = "All skin types";
  } else if (item.categorySlug.includes("electronics") || item.categorySlug.includes("mobile")) {
    highlights.Warranty = "6 months seller warranty";
    highlights.Compatibility = "Universal";
  } else if (item.categorySlug.includes("home") || item.categorySlug.includes("household")) {
    highlights.Material = "Everyday household grade";
    highlights.Care = "Wipe clean";
  } else if (item.categorySlug.includes("sports") || item.categorySlug.includes("health")) {
    highlights.Use = "Home fitness";
    highlights.Level = "Beginner friendly";
  }

  return {
    ratingAverage,
    reviewCount,
    dealEndsAt,
    deliveryFeePaise,
    highlights,
  };
}

const FASHION_SIZES = ["S", "M", "L", "XL"] as const;

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
      categoryName: SEED_CATEGORIES.find(
        (category) => category.slug === item.categorySlug,
      )?.name,
      sku: item.sku,
    });
    const attributes = storefrontAttributes(item, index) as Prisma.InputJsonValue;
    const useFashionSizes = item.categorySlug === "fashion";

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
            attributes,
            submittedAt: new Date(),
            reviewedAt: status === "approved" ? new Date() : null,
            reviewedByUserId: status === "approved" ? input.adminUserId : null,
            publishedAt: status === "approved" ? new Date() : null,
            statusReason:
              status === "approved"
                ? "Seeded approved listing"
                : `Seed ${status} listing`,
          },
        });

        const variantDefs = useFashionSizes
          ? FASHION_SIZES.map((size, sizeIndex) => ({
              sku: `${item.sku}-${size}`,
              title: size,
              optionValues: { size } as Prisma.InputJsonValue,
              mrpPaise: item.mrpPaise + sizeIndex * 200,
              sellingPricePaise: item.sellingPricePaise + sizeIndex * 200,
              onHand: Math.max(2, Math.floor(item.onHand / FASHION_SIZES.length)),
            }))
          : [
              {
                sku: item.sku,
                title: "Standard",
                optionValues: Prisma.JsonNull,
                mrpPaise: item.mrpPaise,
                sellingPricePaise: item.sellingPricePaise,
                onHand: item.onHand,
              },
            ];

        for (const def of variantDefs) {
          const variant = await tx.productVariant.create({
            data: {
              productId: product.id,
              sku: def.sku,
              title: def.title,
              optionValues: def.optionValues,
              mrpPaise: def.mrpPaise,
              sellingPricePaise: def.sellingPricePaise,
              weightGrams: item.weightGrams,
            },
          });
          const inventory = await tx.inventoryItem.create({
            data: {
              variantId: variant.id,
              sellerId: seller.id,
              onHand: def.onHand,
              reserved: 0,
              damaged: 0,
            },
          });
          if (def.onHand > 0) {
            await tx.stockMovement.create({
              data: {
                inventoryItemId: inventory.id,
                movementType: "receive",
                quantity: def.onHand,
                reason: "Seed initial stock",
                actorId: input.adminUserId,
                correlationId: `seed-${def.sku}`,
              },
            });
          }
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
          attributes,
          status,
          publishedAt:
            status === "approved"
              ? (existing.publishedAt ?? new Date())
              : null,
        },
      });

      if (useFashionSizes) {
        const sizeSkus = new Set(FASHION_SIZES.map((size) => `${item.sku}-${size}`));
        for (const variant of existing.variants) {
          if (!sizeSkus.has(variant.sku)) {
            await prisma.productVariant.update({
              where: { id: variant.id },
              data: { isActive: false },
            });
          }
        }
        for (const [sizeIndex, size] of FASHION_SIZES.entries()) {
          const sku = `${item.sku}-${size}`;
          const found = existing.variants.find((variant) => variant.sku === sku);
          if (found) {
            await prisma.productVariant.update({
              where: { id: found.id },
              data: {
                title: size,
                optionValues: { size },
                mrpPaise: item.mrpPaise + sizeIndex * 200,
                sellingPricePaise: item.sellingPricePaise + sizeIndex * 200,
                weightGrams: item.weightGrams,
                isActive: true,
              },
            });
            await prisma.inventoryItem.updateMany({
              where: { variantId: found.id },
              data: {
                onHand: Math.max(2, Math.floor(item.onHand / FASHION_SIZES.length)),
                sellerId: seller.id,
              },
            });
          } else {
            const variant = await prisma.productVariant.create({
              data: {
                productId: existing.id,
                sku,
                title: size,
                optionValues: { size },
                mrpPaise: item.mrpPaise + sizeIndex * 200,
                sellingPricePaise: item.sellingPricePaise + sizeIndex * 200,
                weightGrams: item.weightGrams,
              },
            });
            await prisma.inventoryItem.create({
              data: {
                variantId: variant.id,
                sellerId: seller.id,
                onHand: Math.max(2, Math.floor(item.onHand / FASHION_SIZES.length)),
                reserved: 0,
                damaged: 0,
              },
            });
          }
        }
      } else {
        const variant = existing.variants[0];
        if (variant) {
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: {
              mrpPaise: item.mrpPaise,
              sellingPricePaise: item.sellingPricePaise,
              weightGrams: item.weightGrams,
              sku: item.sku,
              isActive: true,
            },
          });
          await prisma.inventoryItem.updateMany({
            where: { variantId: variant.id },
            data: { onHand: item.onHand, sellerId: seller.id },
          });
        }
      }

      // Refresh images so category pools stay aligned with titles
      await prisma.productImage.deleteMany({ where: { productId: existing.id } });
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
