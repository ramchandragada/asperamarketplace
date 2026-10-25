import { requireActor } from "@/modules/identity/service";
import { mockCompletePaymentSchema } from "@/modules/orders/schema";
import { simulateMockPaymentOutcome } from "@/modules/orders/service";
import { mockSelfPayAllowed } from "@/modules/payments/provider";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";
import { NotFoundError } from "@/platform/http/errors";

export const dynamic = "force-dynamic";

/**
 * Demo helper: emits a signed mock provider webhook so an authenticated buyer
 * can drive their own order to paid/failed without a real gateway.
 *
 * Allowed only while {@link mockSelfPayAllowed} is true (mock provider +
 * non-prod, or explicit `ALLOW_MOCK_SELF_PAY=true` in production). Shoppers
 * must never self-mark a real payment as paid.
 */
export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    if (!mockSelfPayAllowed()) {
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
