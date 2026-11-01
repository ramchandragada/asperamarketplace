import {
  listActiveBrands,
  listCataloguePickProducts,
  listCataloguePickTree,
} from "@/modules/catalogue/service";
import { HttpValidationError } from "@/platform/http/errors";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

/**
 * Closed-catalogue cascade for sellers:
 * - (default) category tree / groups
 * - ?categorySlug=… → brands in that leaf category
 * - ?categorySlug=…&brandSlug=… → products + variants (SKUs)
 */
export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const url = new URL(request.url);
    const categorySlug = url.searchParams.get("categorySlug")?.trim() || undefined;
    const brandSlug = url.searchParams.get("brandSlug")?.trim() || undefined;

    if (!categorySlug) {
      const tree = await listCataloguePickTree();
      return jsonOk(tree, requestId);
    }

    if (!brandSlug) {
      const brands = await listActiveBrands({ categorySlug });
      return jsonOk({ categorySlug, brands }, requestId);
    }

    if (brandSlug.length < 1) {
      throw new HttpValidationError("brandSlug is required", {
        brandSlug: ["Select a brand"],
      });
    }

    const products = await listCataloguePickProducts({
      categorySlug,
      brandSlug,
    });
    return jsonOk({ categorySlug, brandSlug, products }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
