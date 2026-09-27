import { requireActor } from "@/modules/identity/service";
import { shipGroupSchema } from "@/modules/fulfilment/schema";
import { shipGroup } from "@/modules/fulfilment/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = shipGroupSchema.parse(await request.json());
    const group = await shipGroup(actor, body, requestId);
    return jsonOk({ group }, requestId, {
      message: "Shipment created with mock tracking",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
