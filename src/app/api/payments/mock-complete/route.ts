import { requireActor } from "@/modules/identity/service";
import { mockCompletePaymentSchema } from "@/modules/orders/schema";
import { simulateMockPaymentOutcome } from "@/modules/orders/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

/** Development-only helper that emits a signed mock provider webhook. */
export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
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
