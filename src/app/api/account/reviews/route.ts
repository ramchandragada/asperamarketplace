import {
  listBuyerReviews,
  listPendingReviews,
} from "@/modules/account/service";
import { requireActor } from "@/modules/identity/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const [reviews, pending] = await Promise.all([
      listBuyerReviews(actor),
      listPendingReviews(actor),
    ]);
    return jsonOk({ reviews, pending }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
