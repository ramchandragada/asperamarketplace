import { listBuyerNotifications } from "@/modules/account/service";
import { requireActor } from "@/modules/identity/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const notifications = await listBuyerNotifications(actor);
    return jsonOk({ notifications }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
