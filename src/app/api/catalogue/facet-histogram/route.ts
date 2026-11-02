import { parseFacetSearchParams } from "@/modules/catalogue/category-facets";
import { searchProductsSchema } from "@/modules/catalogue/schema";
import { listFacetHistogram } from "@/modules/catalogue/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const url = new URL(request.url);
    const facets = parseFacetSearchParams(url.searchParams);
    const brandSlugs = url.searchParams
      .getAll("brandSlug")
      .map((value) => value.trim())
      .filter(Boolean);
    const input = searchProductsSchema.parse({
      q: url.searchParams.get("q") ?? undefined,
      categorySlug: url.searchParams.get("categorySlug") ?? undefined,
      brandSlug:
        brandSlugs.length === 1
          ? brandSlugs[0]
          : (url.searchParams.get("brandSlug") ?? undefined),
      brandSlugs: brandSlugs.length > 1 ? brandSlugs : undefined,
      facets: Object.keys(facets).length > 0 ? facets : undefined,
      minPricePaise: url.searchParams.get("minPricePaise") ?? undefined,
      maxPricePaise: url.searchParams.get("maxPricePaise") ?? undefined,
      inStockOnly: url.searchParams.get("inStockOnly") === "true",
      verifiedSellerOnly: url.searchParams.get("verifiedSellerOnly") === "true",
      minRating: url.searchParams.get("minRating") ?? undefined,
      minDiscountPercent: url.searchParams.get("minDiscountPercent") ?? undefined,
      page: 1,
      pageSize: 12,
    });
    const result = await listFacetHistogram(input);
    return jsonOk(result, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
