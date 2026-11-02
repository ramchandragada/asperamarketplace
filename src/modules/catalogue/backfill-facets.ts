/**
 * Recompute Product.attributes.facets for approved catalogue SKUs.
 * Preserves other enrichment fields; refreshes facets from title (+ admin
 * values already stored when present as the previous facets baseline).
 */
import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { extractProductFacets } from "@/modules/catalogue/category-facets";
import type { EnrichmentAttributes } from "@/modules/catalogue/product-enrichment-types";
import { CATALOGUE_OWNER_TRADE_NAME } from "@/modules/catalogue/constants";

function facetsEqual(
  a: Record<string, string>,
  b: Record<string, string>,
): boolean {
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key, index) => bKeys[index] === key && a[key] === b[key]);
}

export type BackfillFacetsResult = {
  scanned: number;
  updated: number;
  skipped: number;
};

export async function backfillProductFacets(
  prisma: PrismaClient,
  options?: { dryRun?: boolean; limit?: number },
): Promise<BackfillFacetsResult> {
  const dryRun = options?.dryRun === true;
  const limit = options?.limit ?? 5_000;

  const products = await prisma.product.findMany({
    where: {
      status: { in: ["approved", "archived"] },
      category: { isActive: true },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      attributes: true,
      sharedListingKey: true,
      category: { select: { slug: true } },
      seller: { select: { tradeName: true } },
    },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const categorySlug = product.category.slug;
    const existing = (product.attributes as EnrichmentAttributes | null) ?? null;
    const previousFacets = existing?.facets ?? {};
    const extracted = extractProductFacets({
      slug: product.slug,
      title: product.title,
      categorySlug,
    });
    // Title extraction wins on shared keys; keep any admin-only keys not
    // produced by the extractor so manual edits are not wiped.
    const nextFacets = { ...previousFacets, ...extracted };

    if (existing?.facets && facetsEqual(previousFacets, nextFacets)) {
      skipped += 1;
      continue;
    }

    const nextAttributes = {
      ...(existing ?? {
        brand: "",
        city: "Pune",
        source: "derived" as const,
        highlights: {},
        highlightRows: [],
        specificationGroups: [],
        descriptionBlocks: [],
        warranty: {
          summary: "6–12 months seller / brand warranty (see listing)",
          covered: "Manufacturing defects under brand or seller policy",
          notCovered: "Physical damage, liquid spill, burn, misuse",
          serviceType: "Seller-facilitated / brand carry-in as applicable",
        },
        cardBullets: [],
      }),
      facets: nextFacets,
    } satisfies EnrichmentAttributes;

    if (!dryRun) {
      await prisma.product.update({
        where: { id: product.id },
        data: { attributes: nextAttributes as Prisma.InputJsonValue },
      });

      // Keep dealer offer copies aligned with the catalogue shell facets.
      if (
        product.sharedListingKey &&
        product.seller.tradeName === CATALOGUE_OWNER_TRADE_NAME
      ) {
        await prisma.product.updateMany({
          where: {
            sharedListingKey: product.sharedListingKey,
            id: { not: product.id },
            status: { not: "archived" },
          },
          data: { attributes: nextAttributes as Prisma.InputJsonValue },
        });
      }
    }
    updated += 1;
  }

  return { scanned: products.length, updated, skipped };
}
