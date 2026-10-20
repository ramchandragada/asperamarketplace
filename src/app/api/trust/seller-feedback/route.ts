import { requireActor } from "@/modules/identity/service";
import {
  createSellerFeedback,
  createSellerFeedbackSchema,
} from "@/modules/trust/seller-feedback";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = createSellerFeedbackSchema.parse(await request.json());
    const feedback = await createSellerFeedback(actor, body, requestId);
    return jsonOk({ feedback }, requestId, {
      status: 201,
      message: "Seller feedback submitted",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
