import { requireActor } from "@/modules/identity/service";
import {
  FulfilmentValidationError,
  listSellerFulfilment,
} from "@/modules/fulfilment/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const sellerId = new URL(request.url).searchParams.get("sellerId");
    if (!sellerId) {
      throw new FulfilmentValidationError("sellerId is required");
    }
    const groups = await listSellerFulfilment(actor, sellerId);
    return jsonOk({ groups }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
