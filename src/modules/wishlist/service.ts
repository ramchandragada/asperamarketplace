import { prisma } from "@/platform/db/prisma";
import { resolveProductBadge } from "@/modules/catalogue/helpers";
import {
  freeDeliveryHintFromPolicy,
  resolveStorefrontRating,
} from "@/modules/catalogue/claims";
import { SHIPPING_POLICY } from "@/modules/cart/pricing";

export async function listWishlistProducts(userId: string) {
  const rows = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
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
      },
    },
  });

  return rows
    .filter((row) => row.product.status === "approved")
    .map((row) => {
      const product = row.product;
      const prices = product.variants.map((v) => v.sellingPricePaise);
      const mrps = product.variants.map((v) => v.mrpPaise);
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
      const sellerVerified = product.seller.status === "approved";
      const minPricePaise = prices.length ? Math.min(...prices) : 0;
      const freeDelivery = freeDeliveryHintFromPolicy({
        minPricePaise,
        freeAbovePaise: SHIPPING_POLICY.freeAbovePaise,
      });
      const storefrontRating = resolveStorefrontRating({
        attributeRatingAverage:
          typeof attrs.ratingAverage === "number" ? attrs.ratingAverage : null,
        attributeReviewCount:
          typeof attrs.reviewCount === "number" ? attrs.reviewCount : null,
      });
      return {
        id: product.id,
        slug: product.slug,
        title: product.title,
        summary: product.summary,
        categoryName: product.category.name,
        sellerName: product.seller.tradeName ?? product.seller.legalName,
        sellerVerified,
        minPricePaise,
        minMrpPaise: mrps.length ? Math.min(...mrps) : null,
        availableQty,
        ratingAverage: storefrontRating?.average ?? null,
        reviewCount: storefrontRating?.count ?? 0,
        dealEndsAt: null,
        deliveryFeePaise: null,
        freeDeliveryHint: freeDelivery,
        variantCount: product.variants.length,
        badge: resolveProductBadge({
          brandSlug: product.brand?.slug,
          brandName: product.brand?.name,
          sellerVerified,
          availableQty,
          freeDelivery,
        }),
        primaryImageUrl: product.images[0]?.url ?? null,
        primaryImageAlt:
          product.images[0]?.altText ??
          `${product.title} (catalogue preview image)`,
      };
    });
}

export async function addWishlistItem(userId: string, productId: string) {
  return prisma.wishlistItem.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId },
    update: {},
  });
}

export async function removeWishlistItem(userId: string, productId: string) {
  await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
}

export async function listWishlistProductIds(userId: string) {
  const rows = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { productId: true },
  });
  return rows.map((row) => row.productId);
}
