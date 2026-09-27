import { searchApprovedProducts } from "@/modules/catalogue/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    if (q.length < 2) {
      return jsonOk({ suggestions: [] }, requestId);
    }
    const result = await searchApprovedProducts({
      q,
      page: 1,
      pageSize: 5,
      sort: "newest",
    });
    return jsonOk(
      {
        suggestions: result.items.map((item) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,
          pricePaise: item.minPricePaise,
          imageUrl: item.primaryImageUrl,
        })),
      },
      requestId,
    );
  } catch (error) {
    return jsonError(requestId, error);
  }
}
