import { requireActor } from "@/modules/identity/service";
import { updateCartItemSchema } from "@/modules/cart/schema";
import { updateCartItem } from "@/modules/cart/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = updateCartItemSchema.parse(await request.json());
    const cart = await updateCartItem(actor, body, requestId);
    return jsonOk({ cart }, requestId, { message: "Cart updated" });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
