import { requireActor } from "@/modules/identity/service";
import { listReturnsForBuyer } from "@/modules/fulfilment/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const returns = await listReturnsForBuyer(actor);
    return jsonOk({ returns }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
