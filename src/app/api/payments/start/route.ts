import { requireActor } from "@/modules/identity/service";
import { startPaymentSchema } from "@/modules/orders/schema";
import { startPayment } from "@/modules/orders/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = startPaymentSchema.parse(await request.json());
    const result = await startPayment(actor, body, requestId);
    return jsonOk(result, requestId, {
      status: 201,
      message: "Mock payment attempt created",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
