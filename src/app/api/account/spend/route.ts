import {
  buildSpendReport,
  spendReportToCsv,
} from "@/modules/account/service";
import { requireActor } from "@/modules/identity/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const format = new URL(request.url).searchParams.get("format");
    const report = await buildSpendReport(actor);
    if (format === "csv") {
      const csv = spendReportToCsv(report.rows);
      return new Response(csv, {
        status: 200,
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="aspera-spend-${new Date().toISOString().slice(0, 10)}.csv"`,
          "x-request-id": requestId,
        },
      });
    }
    return jsonOk({ report }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
