import {
  deleteAddress,
  updateAddress,
} from "@/modules/cart/service";
import { updateAddressSchema } from "@/modules/cart/schema";
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
    const body = updateAddressSchema.parse(await request.json());
    const address = await updateAddress(actor, id, body, requestId);
    return jsonOk({ address }, requestId, { message: "Address updated" });
  } catch (error) {
    return jsonError(requestId, error);
  }
}

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
