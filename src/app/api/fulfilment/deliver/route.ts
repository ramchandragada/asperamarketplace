import { requireActor } from "@/modules/identity/service";
import { markDeliveredSchema } from "@/modules/fulfilment/schema";
import { markDelivered } from "@/modules/fulfilment/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = markDeliveredSchema.parse(await request.json());
    const group = await markDelivered(actor, body, requestId);
    return jsonOk({ group }, requestId, {
      message: "Fulfilment group marked delivered",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
