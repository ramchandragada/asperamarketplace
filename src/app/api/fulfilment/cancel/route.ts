import { requireActor } from "@/modules/identity/service";
import { cancelGroupSchema } from "@/modules/fulfilment/schema";
import { cancelFulfilmentGroup } from "@/modules/fulfilment/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = cancelGroupSchema.parse(await request.json());
    const group = await cancelFulfilmentGroup(actor, body, requestId);
    return jsonOk({ group }, requestId, {
      message: "Fulfilment group cancelled with mock refund",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
