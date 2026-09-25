import type { PrismaClient, ProductStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { buildSearchDocument } from "./helpers";
import {
  imagesForProduct,
  SEED_BRANDS,
  SEED_CATEGORIES,
  SEED_PRODUCTS,
} from "./seed-catalogue-data";

export type SeedSellerMap = Record<string, { id: string }>;

function storefrontAttributes(item: (typeof SEED_PRODUCTS)[number]) {
  /**
   * P0 truthfulness: do not fabricate ratingAverage, reviewCount, ratingDistribution,
   * or dealEndsAt. Public ratings must come from ProductReview rows only.
   * Delivery fees are not invented here — checkout uses SHIPPING_POLICY.
   */
  const highlights: Record<string, string> = {};
  if (item.categorySlug === "fashion") {
    highlights.Material = "Cotton blend";
    highlights.Occasion = "Casual";
    highlights.Fit = "Regular";
    highlights.Origin = "India";
  } else if (item.categorySlug.includes("beauty")) {
    highlights.Type = "Personal care";
    highlights.Skin = "All skin types";
    highlights.Origin = "India";
  } else if (
    item.categorySlug.includes("electronics") ||
    item.categorySlug.includes("mobile")
  ) {
    highlights.Warranty = "6 months seller warranty";
    highlights.Compatibility = "Universal";
    highlights.Origin = "India";
  } else if (
    item.categorySlug.includes("home") ||
    item.categorySlug.includes("household")
  ) {
    highlights.Material = "Everyday household grade";
    highlights.Care = "Wipe clean";
    highlights.Origin = "India";
  } else if (
    item.categorySlug.includes("sports") ||
    item.categorySlug.includes("health")
  ) {
    highlights.Use = "Home fitness";
    highlights.Level = "Beginner friendly";
    highlights.Origin = "India";
  } else {
    highlights.Origin = "India";
  }

  return {
    demoCatalogue: true,
    mediaPlaceholder: true,
    mediaNote:
      "Development Unsplash placeholders — replace with licensed product photography before commercial launch.",
    highlights,
  };
}

function customerFacingDescription(item: (typeof SEED_PRODUCTS)[number]) {
  if (!/seed|fictional|demo|development|placeholder/i.test(item.description)) {
    return item.description;
  }
  const title = item.title;
  if (item.categorySlug === "fashion") {
    return `${title} crafted for everyday Indian wardrobes. Soft, breathable fabric with a comfortable regular fit that layers well through the year. Easy to wash and pair with casual or festive looks.`;
  }
  if (item.categorySlug.includes("beauty")) {
    return `${title} for daily grooming routines. Lightweight formula designed for regular use with a fresh finish. Packaged for bathroom shelves and travel pouches alike.`;
  }
  if (
    item.categorySlug.includes("electronics") ||
    item.categorySlug.includes("mobile")
  ) {
    return `${title} built for reliable everyday use. Compact design with practical ports and protective detailing for desks, bags, and on-the-go charging. Compatible with common devices.`;
  }
  if (item.categorySlug.includes("home") || item.categorySlug.includes("household")) {
    return `${title} made for Indian homes and apartments. Durable everyday construction that is easy to clean and store. A practical upgrade for kitchens, living rooms, or utility spaces.`;
  }
  if (item.categorySlug.includes("baby")) {
    return `${title} designed with little ones in mind. Soft-touch materials and practical sizing for daily care routines. Easy to pack for home, travel, or gifting.`;
  }
  if (item.categorySlug.includes("sports") || item.categorySlug.includes("health")) {
    return `${title} for home workouts and active routines. Stable, beginner-friendly build that stores compactly after use. Suitable for living-room sessions and outdoor warm-ups.`;
  }
  return `${title} selected for everyday value on Aspera. Thoughtful materials and practical sizing for Indian households. A reliable pick for regular use and easy reordering.`;
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
    const sellerPool = Object.values(input.sellers);
    const preferred = input.sellers[item.sellerKey];
    const seller =
      preferred ?? sellerPool[index % Math.max(sellerPool.length, 1)]!;
    // Rotate some listings across extra sellers for storefront diversity
    const diversified =
      sellerPool.length > 4 && index % 3 === 0
        ? sellerPool[index % sellerPool.length]!
        : seller;
    const categoryId = categoryIds[item.categorySlug];
    const brandId = brandIds[item.brandSlug];
    if (!diversified || !categoryId || !brandId) {
      throw new Error(`Missing refs for ${item.slug}`);
    }
    const activeSeller = diversified;

    const status: ProductStatus = item.status ?? "approved";
    const description = customerFacingDescription(item);
    const searchDocument = buildSearchDocument({
      title: item.title,
      summary: item.summary,
      description,
      brandName: SEED_BRANDS.find((brand) => brand.slug === item.brandSlug)?.name,
      categoryName: SEED_CATEGORIES.find(
        (category) => category.slug === item.categorySlug,
      )?.name,
      sku: item.sku,
    });
    const attributes = storefrontAttributes(item) as Prisma.InputJsonValue;
    const useFashionSizes = item.categorySlug === "fashion";

    const existing = await prisma.product.findUnique({
      where: { slug: item.slug },
      include: { variants: true, images: true },
    });

    if (!existing) {
      await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            sellerId: activeSeller.id,
            categoryId,
            brandId,
            slug: item.slug,
            title: item.title,
            summary: item.summary,
            description,
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
              sellerId: activeSeller.id,
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
          description,
          categoryId,
          brandId,
          sellerId: activeSeller.id,
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
                sellerId: activeSeller.id,
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
                sellerId: activeSeller.id,
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
            data: { onHand: item.onHand, sellerId: activeSeller.id },
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
