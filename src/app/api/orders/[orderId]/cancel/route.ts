import { z } from "zod";
import { requireActor } from "@/modules/identity/service";
import { cancelBuyerOrder } from "@/modules/orders/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3)
    .max(500)
    .default("Cancelled by customer"),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const { orderId } = await context.params;
    const json = await request.json().catch(() => ({}));
    const body = bodySchema.parse(json);
    const order = await cancelBuyerOrder(
      actor,
      orderId,
      body.reason,
      requestId,
    );
    return jsonOk({ order }, requestId, { message: "Order cancelled" });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
