import { requireActor } from "@/modules/identity/service";
import { submitProductSchema } from "@/modules/catalogue/schema";
import { submitProductForReview } from "@/modules/catalogue/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = submitProductSchema.parse(await request.json());
    const product = await submitProductForReview(actor, body, requestId);
    return jsonOk({ product }, requestId, {
      message: "Product submitted for moderation",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
