import { requireActor } from "@/modules/identity/service";
import { createSettlementSchema } from "@/modules/finance/schema";
import {
  createSettlementBatch,
  listSettlements,
} from "@/modules/finance/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const sellerId =
      new URL(request.url).searchParams.get("sellerId") ?? undefined;
    const settlements = await listSettlements(actor, sellerId);
    return jsonOk({ settlements }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const body = createSettlementSchema.parse(await request.json());
    const batch = await createSettlementBatch(actor, body, requestId);
    return jsonOk({ batch }, requestId, {
      status: 201,
      message: "Settlement batch created",
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
