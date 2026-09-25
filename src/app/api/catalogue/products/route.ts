import { searchProductsSchema } from "@/modules/catalogue/schema";
import { searchApprovedProducts } from "@/modules/catalogue/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const url = new URL(request.url);
    const input = searchProductsSchema.parse({
      q: url.searchParams.get("q") ?? undefined,
      categorySlug: url.searchParams.get("categorySlug") ?? undefined,
      brandSlug: url.searchParams.get("brandSlug") ?? undefined,
      minPricePaise: url.searchParams.get("minPricePaise") ?? undefined,
      maxPricePaise: url.searchParams.get("maxPricePaise") ?? undefined,
      inStockOnly: url.searchParams.get("inStockOnly") === "true",
      verifiedSellerOnly: url.searchParams.get("verifiedSellerOnly") === "true",
      minRating: url.searchParams.get("minRating") ?? undefined,
      minDiscountPercent: url.searchParams.get("minDiscountPercent") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });
    const result = await searchApprovedProducts(input);
    return jsonOk(result, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
