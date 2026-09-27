import { requireActor } from "@/modules/identity/service";
import { listProductsForModeration } from "@/modules/catalogue/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const products = await listProductsForModeration(actor);
    return jsonOk({ products }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
