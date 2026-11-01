import { requireActor } from "@/modules/identity/service";
import { deleteSellerApplicationSchema } from "@/modules/seller/schema";
import { deleteSellerApplication } from "@/modules/seller/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = deleteSellerApplicationSchema.parse(await request.json());
    const result = await deleteSellerApplication(actor, body, requestId);
    return jsonOk(result, requestId, {
      message: "Seller application deleted",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
