/**
 * Backfill the v2 shared-catalogue tables from the current per-seller product
 * model. Approved products that share a `sharedListingKey` (or a solo product
 * on its own) collapse into ONE CatalogueProduct + CatalogueVariants, and each
 * seller's product+variant becomes a SellerOffer with its own price and stock.
 *
 * Safe and idempotent: it only writes the new catalogue_* / seller_offers /
 * offer_inventory tables, and skips any group whose canonical slug already
 * exists. Nothing reads these tables until CATALOGUE_V2 is flipped on.
 *
 * Demo-data assumptions (fine for the current seed; revisit for real sellers):
 * - only `approved` products are backfilled; condition defaults to `new`;
 * - sibling sellers use matching variant titles, so offers map by variant
 *   title, falling back to position.
 */
import { prisma } from "@/platform/db/prisma";

type BackfillResult = {
  groups: number;
  created: { products: number; variants: number; offers: number };
  skipped: number;
};

function groupKey(sharedListingKey: string | null, productId: string): string {
  return sharedListingKey ?? `solo:${productId}`;
}

export async function backfillCatalogueV2(): Promise<BackfillResult> {
  const products = await prisma.product.findMany({
    where: { status: "approved" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, include: { inventory: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const groups = new Map<string, typeof products>();
  for (const product of products) {
    const key = groupKey(product.sharedListingKey, product.id);
    const bucket = groups.get(key) ?? [];
    bucket.push(product);
    groups.set(key, bucket);
  }

  const result: BackfillResult = {
    groups: groups.size,
    created: { products: 0, variants: 0, offers: 0 },
    skipped: 0,
  };

  for (const members of groups.values()) {
    // Oldest member is the canonical source of the shared facts.
    const canonical = members[0];
    if (!canonical) continue;

    const existing = await prisma.catalogueProduct.findUnique({
      where: { slug: canonical.slug },
      select: { id: true },
    });
    if (existing) {
      result.skipped += 1;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const catalogueProduct = await tx.catalogueProduct.create({
        data: {
          slug: canonical.slug,
          categoryId: canonical.categoryId,
          brandId: canonical.brandId,
          title: canonical.title,
          summary: canonical.summary,
          description: canonical.description,
          status: "approved",
          countryOfOrigin: canonical.countryOfOrigin,
          hsnCode: canonical.hsnCode,
          attributes: canonical.attributes ?? undefined,
          searchDocument: canonical.searchDocument,
          publishedAt: canonical.publishedAt ?? new Date(),
        },
      });
      result.created.products += 1;

      for (const image of canonical.images) {
        await tx.catalogueImage.create({
          data: {
            catalogueProductId: catalogueProduct.id,
            url: image.url,
            altText: image.altText,
            sortOrder: image.sortOrder,
            isPrimary: image.isPrimary,
          },
        });
      }

      // One shared variant per canonical variant; remember title + position so
      // each seller's variant can map onto it.
      const byTitle = new Map<string, string>();
      const byPosition: string[] = [];
      for (const variant of canonical.variants) {
        const catalogueVariant = await tx.catalogueVariant.create({
          data: {
            catalogueProductId: catalogueProduct.id,
            title: variant.title,
            optionValues: variant.optionValues ?? undefined,
            mrpPaise: variant.mrpPaise,
            weightGrams: variant.weightGrams,
          },
        });
        result.created.variants += 1;
        byTitle.set(variant.title, catalogueVariant.id);
        byPosition.push(catalogueVariant.id);
      }

      for (const member of members) {
        // A seller can hold at most one offer per shared variant.
        const usedVariantIds = new Set<string>();
        for (const [index, variant] of member.variants.entries()) {
          const catalogueVariantId =
            byTitle.get(variant.title) ?? byPosition[index] ?? byPosition[0];
          if (!catalogueVariantId || usedVariantIds.has(catalogueVariantId)) {
            continue;
          }
          usedVariantIds.add(catalogueVariantId);
          result.created.offers += 1;
          await tx.sellerOffer.create({
            data: {
              sellerId: member.sellerId,
              catalogueVariantId,
              sku: variant.sku,
              sellingPricePaise: variant.sellingPricePaise,
              mrpPaise: variant.mrpPaise,
              condition: "new",
              status: "approved",
              inventory: {
                create: {
                  onHand: variant.inventory?.onHand ?? 0,
                  reserved: variant.inventory?.reserved ?? 0,
                  damaged: variant.inventory?.damaged ?? 0,
                },
              },
            },
          });
        }
      }
    });
  }

  return result;
}
