import { requireActor } from "@/modules/identity/service";
import { createAddressSchema } from "@/modules/cart/schema";
import { createAddress, listAddresses } from "@/modules/cart/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const addresses = await listAddresses(actor);
    return jsonOk({ addresses }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = createAddressSchema.parse(await request.json());
    const address = await createAddress(actor, body, requestId);
    return jsonOk({ address }, requestId, {
      status: 201,
      message: "Address saved",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
