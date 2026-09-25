import { requireActor } from "@/modules/identity/service";
import { createDisputeSchema } from "@/modules/fulfilment/schema";
import { createDispute } from "@/modules/fulfilment/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = createDisputeSchema.parse(await request.json());
    const dispute = await createDispute(actor, body, requestId);
    return jsonOk({ dispute }, requestId, {
      status: 201,
      message: "Dispute opened",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
