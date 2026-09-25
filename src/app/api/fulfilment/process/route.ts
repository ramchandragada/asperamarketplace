import { requireActor } from "@/modules/identity/service";
import { startProcessingSchema } from "@/modules/fulfilment/schema";
import { startProcessing } from "@/modules/fulfilment/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = startProcessingSchema.parse(await request.json());
    const group = await startProcessing(actor, body, requestId);
    return jsonOk({ group }, requestId, {
      message: "Fulfilment group is now processing",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
