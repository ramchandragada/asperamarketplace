import { requireActor } from "@/modules/identity/service";
import { listSellersForAdmin } from "@/modules/seller/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const sellers = await listSellersForAdmin(actor);
    return jsonOk({ sellers }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
