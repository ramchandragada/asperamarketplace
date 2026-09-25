import { requireActor } from "@/modules/identity/service";
import { submitSellerSchema } from "@/modules/seller/schema";
import { submitSellerForReview } from "@/modules/seller/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = submitSellerSchema.parse(await request.json());
    const seller = await submitSellerForReview(actor, body, requestId);
    return jsonOk({ seller }, requestId, { message: "Seller submitted" });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
