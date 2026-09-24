import { requireActor } from "@/modules/identity/service";
import { createSellerDraftSchema } from "@/modules/seller/schema";
import {
  createSellerDraft,
  listOwnedSellers,
} from "@/modules/seller/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const sellers = await listOwnedSellers(actor);
    return jsonOk({ sellers }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = createSellerDraftSchema.parse(await request.json());
    const seller = await createSellerDraft(actor, body, requestId);
    return jsonOk({ seller }, requestId, {
      status: 201,
      message: "Seller draft created",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
