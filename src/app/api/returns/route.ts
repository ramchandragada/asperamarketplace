import { requireActor } from "@/modules/identity/service";
import { createReturnSchema } from "@/modules/fulfilment/schema";
import {
  createReturnRequest,
  FulfilmentValidationError,
  listReturnsForSeller,
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
    const returns = await listReturnsForSeller(actor, sellerId);
    return jsonOk({ returns }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = createReturnSchema.parse(await request.json());
    const returnRequest = await createReturnRequest(actor, body, requestId);
    return jsonOk({ returnRequest }, requestId, {
      status: 201,
      message: "Return request created",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
