import { requireActor } from "@/modules/identity/service";
import { addCartItemSchema } from "@/modules/cart/schema";
import { addCartItem, getCartForActor } from "@/modules/cart/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const cart = await getCartForActor(actor);
    return jsonOk({ cart }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = addCartItemSchema.parse(await request.json());
    const cart = await addCartItem(actor, body, requestId);
    return jsonOk({ cart }, requestId, {
      status: 201,
      message: "Item added to cart",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
