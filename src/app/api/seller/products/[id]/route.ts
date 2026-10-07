import { updateSellerProductSchema } from "@/modules/catalogue/schema";
import {
  getSellerProduct,
  updateSellerProduct,
} from "@/modules/catalogue/service";
import { requireActor } from "@/modules/identity/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const { id } = await context.params;
    const url = new URL(request.url);
    const sellerId = url.searchParams.get("sellerId");
    if (!sellerId) {
      return jsonError(requestId, {
        name: "ValidationError",
        message: "sellerId is required",
        code: "VALIDATION_ERROR",
      });
    }
    const product = await getSellerProduct(actor, sellerId, id);
    if (!product) {
      return jsonError(requestId, {
        name: "NotFoundError",
        message: "Product not found",
        code: "NOT_FOUND",
      });
    }
    return jsonOk({ product }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const { id } = await context.params;
    const body = updateSellerProductSchema.parse({
      ...(await request.json()),
      productId: id,
    });
    const product = await updateSellerProduct(actor, body, requestId);
    return jsonOk({ product }, requestId, { message: "Product updated" });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
