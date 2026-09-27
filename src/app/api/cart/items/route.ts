import { getOptionalActor } from "@/modules/identity/service";
import { updateCartItemSchema } from "@/modules/cart/schema";
import { updateCartItem } from "@/modules/cart/service";
import {
  ensureGuestCartIdentity,
  type CartIdentity,
} from "@/modules/cart/guest";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

async function resolveCartIdentity(): Promise<CartIdentity> {
  const actor = await getOptionalActor();
  if (actor) {
    return { type: "user", userId: actor.userId };
  }
  return ensureGuestCartIdentity();
}

export async function PATCH(request: Request) {
  const requestId = getRequestId(request);
  try {
    const identity = await resolveCartIdentity();
    const body = updateCartItemSchema.parse(await request.json());
    const cart = await updateCartItem(identity, body, requestId);
    return jsonOk({ cart }, requestId, { message: "Cart updated" });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
