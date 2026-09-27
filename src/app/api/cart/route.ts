import { getOptionalActor } from "@/modules/identity/service";
import { addCartItemSchema } from "@/modules/cart/schema";
import {
  addCartItem,
  getCartForIdentity,
} from "@/modules/cart/service";
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

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const identity = await resolveCartIdentity();
    const cart = await getCartForIdentity(identity);
    return jsonOk({ cart }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const identity = await resolveCartIdentity();
    const body = addCartItemSchema.parse(await request.json());
    const cart = await addCartItem(identity, body, requestId);
    return jsonOk({ cart }, requestId, {
      status: 201,
      message: "Item added to cart",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
