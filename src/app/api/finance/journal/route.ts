import { requireActor } from "@/modules/identity/service";
import { listJournalEntries, financeSummary } from "@/modules/finance/service";
import { getRequestId, jsonError, jsonOk } from "@/platform/http/respond";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const actor = await requireActor();
    const url = new URL(request.url);
    if (url.searchParams.get("summary") === "1") {
      const summary = await financeSummary(actor);
      return jsonOk({ summary }, requestId);
    }
    const entries = await listJournalEntries(actor);
    return jsonOk({ entries }, requestId);
  } catch (error) {
    return jsonError(requestId, error);
  }
}
