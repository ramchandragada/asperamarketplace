import { requireActor } from "@/modules/identity/service";
import { createProductSchema } from "@/modules/catalogue/schema";
import {
  createProductDraft,
  listSellerProducts,
} from "@/modules/catalogue/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const url = new URL(request.url);
    const sellerId = url.searchParams.get("sellerId");
    if (!sellerId) {
      return jsonError(requestId, {
        name: "ValidationError",
        message: "sellerId is required",
        code: "VALIDATION_ERROR",
      });
    }
    const products = await listSellerProducts(actor, sellerId);
    return jsonOk({ products }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = createProductSchema.parse(await request.json());
    const created = await createProductDraft(actor, body, requestId);
    return jsonOk(created, requestId, {
      status: 201,
      message: "Product draft created",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
