import { updateSellerProductSchema } from "@/modules/catalogue/schema";
import {
  getSellerProduct,
  updateSellerProduct,
} from "@/modules/catalogue/service";
import { AuthorizationError } from "@/modules/identity/policy";
import { requireActor } from "@/modules/identity/service";
import { resolveSellerForActor } from "@/modules/seller/access";
import { assertUuid, NotFoundError } from "@/platform/http/errors";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

async function resolveCatalogueSellerId(
  actor: Awaited<ReturnType<typeof requireActor>>,
  preferred: string | null | undefined,
) {
  if (preferred) {
    assertUuid(preferred, "sellerId");
    const seller = await resolveSellerForActor(
      actor,
      "catalogue.write",
      preferred,
    );
    if (!seller) {
      throw new AuthorizationError("Seller catalogue access denied");
    }
    return seller.id;
  }
  const seller = await resolveSellerForActor(actor, "catalogue.write");
  if (!seller) {
    throw new AuthorizationError("No approved seller workspace for catalogue");
  }
  return seller.id;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const { id } = await context.params;
    assertUuid(id, "id");
    const url = new URL(request.url);
    const sellerId = await resolveCatalogueSellerId(
      actor,
      url.searchParams.get("sellerId"),
    );
    const product = await getSellerProduct(actor, sellerId, id);
    if (!product) {
      throw new NotFoundError("Product not found");
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
    assertUuid(id, "id");
    const raw = (await request.json()) as Record<string, unknown>;
    const sellerId = await resolveCatalogueSellerId(
      actor,
      typeof raw.sellerId === "string" ? raw.sellerId : null,
    );
    const body = updateSellerProductSchema.parse({
      ...raw,
      sellerId,
      productId: id,
    });
    const product = await updateSellerProduct(actor, body, requestId);
    return jsonOk({ product }, requestId, { message: "Product updated" });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
