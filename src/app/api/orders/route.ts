import { requireActor } from "@/modules/identity/service";
import { createOrderFromCheckoutSchema } from "@/modules/orders/schema";
import {
  createOrderFromCheckout,
  listOrdersForActor,
} from "@/modules/orders/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const orders = await listOrdersForActor(actor);
    return jsonOk({ orders }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = createOrderFromCheckoutSchema.parse(await request.json());
    const result = await createOrderFromCheckout(actor, body, requestId);
    return jsonOk(result, requestId, {
      status: 201,
      message: "Order created. Start mock payment next.",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
