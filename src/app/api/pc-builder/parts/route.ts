import { z } from "zod";
import { BUILDER_SLOTS, type BuilderSlotId } from "@/lib/pc-builder";
import { searchApprovedProducts } from "@/modules/catalogue/service";
import { prisma } from "@/platform/db/prisma";
import { HttpValidationError } from "@/platform/http/errors";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  slot: z.enum([
    "cpu",
    "motherboard",
    "memory",
    "storage",
    "gpu",
    "cooler",
    "case",
    "psu",
    "keyboard",
    "mouse",
  ]),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(24).default(12),
});

function parseFacets(url: URL): Record<string, string[]> {
  const facets: Record<string, string[]> = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (!key.startsWith("facet.")) continue;
    const facetKey = key.slice("facet.".length);
    if (!facetKey) continue;
    (facets[facetKey] ??= []).push(value);
  }
  return facets;
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const url = new URL(request.url);
    const parsed = querySchema.parse({
      slot: url.searchParams.get("slot") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });
    const slot = BUILDER_SLOTS.find((entry) => entry.id === parsed.slot);
    if (!slot) {
      throw new HttpValidationError("Unknown builder slot");
    }

    const requestFacets = parseFacets(url);
    const facets = {
      ...slot.facetDefaults,
      ...requestFacets,
    };

    const result = await searchApprovedProducts({
      categorySlug: slot.categorySlug,
      q: parsed.q,
      facets: Object.keys(facets).length > 0 ? facets : undefined,
      inStockOnly: true,
      sort: parsed.q ? "relevance" : "price_asc",
      page: parsed.page,
      pageSize: parsed.pageSize,
    });

    const productIds = result.items.map((item) => item.id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        attributes: true,
        variants: {
          where: { isActive: true },
          include: { inventory: true },
          orderBy: { sellingPricePaise: "asc" },
        },
      },
    });
    const byId = new Map(products.map((row) => [row.id, row]));

    const items = result.items
      .map((item) => {
        const row = byId.get(item.id);
        if (!row) return null;
        const variant = row.variants.find((entry) => {
          const onHand = entry.inventory?.onHand ?? 0;
          const reserved = entry.inventory?.reserved ?? 0;
          return onHand - reserved > 0;
        }) ?? row.variants[0];
        if (!variant) return null;
        const attrs = (row.attributes ?? {}) as {
          facets?: Record<string, string>;
        };
        return {
          productId: item.id,
          variantId: variant.id,
          slug: item.slug,
          title: item.title,
          imageUrl: item.primaryImageUrl,
          pricePaise: item.minPricePaise,
          mrpPaise: item.minMrpPaise ?? null,
          availableQty: item.availableQty,
          sellerName: item.sellerName,
          facets: attrs.facets ?? {},
        };
      })
      .filter(Boolean);

    return jsonOk(
      {
        slot: parsed.slot as BuilderSlotId,
        items,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      },
      requestId,
    );
  } catch (error) {
    return jsonError(requestId, error);
  }
}
