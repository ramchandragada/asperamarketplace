import { requireActor } from "@/modules/identity/service";
import { requireAdmin } from "@/modules/identity/policy";
import { buildGstr8Export, gstr8ToCsv } from "@/modules/finance/gstr8";
import { getRequestId, jsonError } from "@/platform/http/respond";
import { REQUEST_ID_HEADER } from "@/platform/http/request-id";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    requireAdmin(actor);
    const url = new URL(request.url);
    const now = new Date();
    const defaultPeriod = `${now.getUTCFullYear()}-${String(
      now.getUTCMonth() + 1,
    ).padStart(2, "0")}`;
    const periodMonth = url.searchParams.get("period") ?? defaultPeriod;
    const format = url.searchParams.get("format")?.toLowerCase() ?? "csv";
    const report = await buildGstr8Export(periodMonth);

    if (format === "json") {
      return new Response(JSON.stringify(report, null, 2), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "content-disposition": `attachment; filename="gstr8-${periodMonth}.json"`,
          [REQUEST_ID_HEADER]: requestId,
        },
      });
    }

    const csv = gstr8ToCsv(report);
    return new Response(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="gstr8-${periodMonth}.csv"`,
        [REQUEST_ID_HEADER]: requestId,
      },
    });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
