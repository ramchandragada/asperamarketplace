import { requireActor } from "@/modules/identity/service";
import { releaseSettlementSchema } from "@/modules/finance/schema";
import { releaseSettlementBatch } from "@/modules/finance/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = releaseSettlementSchema.parse(await request.json());
    const batch = await releaseSettlementBatch(actor, body, requestId);
    return jsonOk({ batch }, requestId, {
      message: "Settlement released (mock payout)",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
