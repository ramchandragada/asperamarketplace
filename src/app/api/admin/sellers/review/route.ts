import { requireActor } from "@/modules/identity/service";
import { reviewSellerSchema } from "@/modules/seller/schema";
import { reviewSeller } from "@/modules/seller/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = reviewSellerSchema.parse(await request.json());
    const seller = await reviewSeller(actor, body, requestId);
    return jsonOk({ seller }, requestId, {
      message:
        body.decision === "approve" ? "Seller approved" : "Seller rejected",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
