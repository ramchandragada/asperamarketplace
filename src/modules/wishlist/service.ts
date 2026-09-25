import { prisma } from "@/platform/db/prisma";

export async function listWishlistProducts(userId: string) {
  const rows = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          category: true,
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
      return {
        id: product.id,
        slug: product.slug,
        title: product.title,
        summary: product.summary,
        categoryName: product.category.name,
        sellerName: product.seller.tradeName ?? product.seller.legalName,
        sellerVerified: product.seller.status === "approved",
        minPricePaise: prices.length ? Math.min(...prices) : 0,
        minMrpPaise: mrps.length ? Math.min(...mrps) : null,
        availableQty,
        ratingAverage:
          typeof attrs.ratingAverage === "number" ? attrs.ratingAverage : null,
        reviewCount:
          typeof attrs.reviewCount === "number" ? attrs.reviewCount : 0,
        dealEndsAt:
          typeof attrs.dealEndsAt === "string" ? attrs.dealEndsAt : null,
        deliveryFeePaise:
          typeof attrs.deliveryFeePaise === "number"
            ? attrs.deliveryFeePaise
            : null,
        freeDeliveryHint: attrs.deliveryFeePaise === 0,
        primaryImageUrl: product.images[0]?.url ?? null,
        primaryImageAlt: product.images[0]?.altText ?? product.title,
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
