import { requireActor } from "@/modules/identity/service";
import { reviewProductSchema } from "@/modules/catalogue/schema";
import { reviewProduct } from "@/modules/catalogue/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = reviewProductSchema.parse(await request.json());
    const product = await reviewProduct(actor, body, requestId);
    return jsonOk({ product }, requestId, {
      message:
        body.decision === "approve" ? "Product approved" : "Product rejected",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
