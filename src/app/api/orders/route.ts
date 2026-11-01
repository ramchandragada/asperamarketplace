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
    const isCod = (body.paymentMethod ?? "cod") === "cod";
    return jsonOk(result, requestId, {
      status: 201,
      message: isCod
        ? "COD order confirmed. Pay cash on delivery."
        : "Order created. Complete prepaid payment next.",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
