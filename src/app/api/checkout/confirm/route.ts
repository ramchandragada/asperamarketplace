import { requireActor } from "@/modules/identity/service";
import { confirmCheckoutSchema } from "@/modules/cart/schema";
import { confirmCheckout } from "@/modules/cart/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = confirmCheckoutSchema.parse(await request.json());
    const result = await confirmCheckout(actor, body, requestId);
    return jsonOk(result, requestId, {
      message: "Checkout reserved. Payment arrives in a later phase.",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
