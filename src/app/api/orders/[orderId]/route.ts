import { requireActor } from "@/modules/identity/service";
import { getOrderForActor } from "@/modules/orders/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const { orderId } = await context.params;
    const order = await getOrderForActor(actor, orderId);
    return jsonOk({ order }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
