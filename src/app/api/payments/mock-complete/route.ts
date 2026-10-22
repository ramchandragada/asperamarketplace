import { requireActor } from "@/modules/identity/service";
import { mockCompletePaymentSchema } from "@/modules/orders/schema";
import { simulateMockPaymentOutcome } from "@/modules/orders/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";
import { readPublicConfig } from "@/platform/config/env";
import { NotFoundError } from "@/platform/http/errors";

export const dynamic = "force-dynamic";

/**
 * Development/test-only helper that emits a signed mock provider webhook so an
 * order can be driven to paid without a real gateway. It is disabled in
 * production: a shopper must never be able to mark their own order paid.
 */
export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    if (readPublicConfig().NODE_ENV === "production") {
      throw new NotFoundError("Not found");
    }
    const actor = await requireActor();
    const body = mockCompletePaymentSchema.parse(await request.json());
    const result = await simulateMockPaymentOutcome(actor, body, requestId);
    return jsonOk(result, requestId, {
      message:
        body.outcome === "succeeded"
          ? "Mock payment succeeded"
          : "Mock payment failed",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
