import { requireActor } from "@/modules/identity/service";
import { buildCatalogueDataQualityReport } from "@/modules/admin/data-quality";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const report = await buildCatalogueDataQualityReport(actor);
    return jsonOk(report, requestId, { message: "Data quality report" });
  } catch (error) {
    return jsonError(requestId, error);
  }
}
