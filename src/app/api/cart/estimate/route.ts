import { getOptionalActor } from "@/modules/identity/service";
import { estimateCartSchema } from "@/modules/cart/schema";
import { estimateCart } from "@/modules/cart/service";
import {
  ensureGuestCartIdentity,
  type CartIdentity,
} from "@/modules/cart/guest";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";
import { CouponRejectedError } from "@/modules/cart/pricing";

export const dynamic = "force-dynamic";

async function resolveCartIdentity(): Promise<CartIdentity> {
  const actor = await getOptionalActor();
  if (actor) {
    return { type: "user", userId: actor.userId };
  }
  return ensureGuestCartIdentity();
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const identity = await resolveCartIdentity();
    const body = estimateCartSchema.parse(await request.json().catch(() => ({})));
    const result = await estimateCart(identity, body);
    return jsonOk(result, requestId, { message: "Cart estimate" });
  } catch (error) {
    if (error instanceof CouponRejectedError) {
      return jsonError(requestId, error);
    }
    return jsonError(requestId, error);
  }
}
