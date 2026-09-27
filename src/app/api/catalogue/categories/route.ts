import { listActiveCategories } from "@/modules/catalogue/service";
import { getRequestId, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const categories = await listActiveCategories();
  return jsonOk({ categories }, requestId);
}
