import { requireActor } from "@/modules/identity/service";
import { createProductOfferSchema } from "@/modules/catalogue/schema";
import { createProductOffer } from "@/modules/catalogue/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = createProductOfferSchema.parse(await request.json());
    const created = await createProductOffer(actor, body, requestId);
    return jsonOk(created, requestId, {
      status: 201,
      message: "Offer draft created for an existing product",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
