import { requireActor } from "@/modules/identity/service";
import { previewCheckoutSchema } from "@/modules/cart/schema";
import { previewCheckout } from "@/modules/cart/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = previewCheckoutSchema.parse(await request.json());
    const result = await previewCheckout(actor, body);
    return jsonOk(result, requestId, { message: "Checkout preview" });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
