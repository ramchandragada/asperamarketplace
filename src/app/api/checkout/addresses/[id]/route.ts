import { deleteAddress } from "@/modules/cart/service";
import { requireActor } from "@/modules/identity/service";
import { assertUuid } from "@/platform/http/errors";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const { id } = await context.params;
    assertUuid(id, "id");
    const result = await deleteAddress(actor, id);
    return jsonOk(result, requestId, { message: "Address deleted" });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
