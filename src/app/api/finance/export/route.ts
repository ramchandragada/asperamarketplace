import { requireActor } from "@/modules/identity/service";
import { exportSettlementsCsv } from "@/modules/finance/service";
import { getRequestId, jsonError } from "@/platform/http/respond";
import { REQUEST_ID_HEADER } from "@/platform/http/request-id";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const csv = await exportSettlementsCsv(actor);
    return new Response(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="settlements.csv"',
        [REQUEST_ID_HEADER]: requestId,
      },
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
