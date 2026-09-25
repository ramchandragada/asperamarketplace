import { requireActor } from "@/modules/identity/service";
import { reviewReturnSchema } from "@/modules/fulfilment/schema";
import { reviewReturnRequest } from "@/modules/fulfilment/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = reviewReturnSchema.parse(await request.json());
    const returnRequest = await reviewReturnRequest(actor, body, requestId);
    return jsonOk({ returnRequest }, requestId, {
      message: `Return ${body.decision}d`,
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
