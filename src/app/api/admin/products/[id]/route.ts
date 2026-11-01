import { updateAdminCatalogueProductSchema } from "@/modules/catalogue/schema";
import { updateAdminCatalogueProduct } from "@/modules/catalogue/service";
import { requireActor } from "@/modules/identity/service";
import { assertUuid } from "@/platform/http/errors";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

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
    const body = updateAdminCatalogueProductSchema.parse({
      ...raw,
      productId: id,
    });
    const product = await updateAdminCatalogueProduct(actor, body, requestId);
    return jsonOk({ product }, requestId, {
      message: "Catalogue product updated",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
