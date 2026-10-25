import {
  listActiveBrands,
  listBrandFilterIndex,
} from "@/modules/catalogue/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const url = new URL(request.url);
    const categorySlug = url.searchParams.get("categorySlug")?.trim() || undefined;
    const includeIndex = url.searchParams.get("index") === "true";

    if (includeIndex) {
      const index = await listBrandFilterIndex();
      return jsonOk(index, requestId);
    }

    const brands = await listActiveBrands({ categorySlug });
    return jsonOk({ brands, categorySlug: categorySlug ?? null }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
